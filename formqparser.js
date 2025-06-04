import {forms_v1, google} from 'googleapis'
/**
 * 
 * @param {OAuth2Client} authClient - oauthClient
 * @returns 
 */
export async function getCourses(authClient)
{
    const classroom =  google.classroom({ version: 'v1', auth: authClient });

    const courses = await classroom.courses.list({
        teacherId: 'me',
        pageSize: 10
    })

    return courses.data.courses
}

/**
 * 
 * @param {any[]} resMultipleQuestion 
 */
export function getMultipleQuestions(resMultipleQuestion){
    if(resMultipleQuestion != undefined)
    {
        let multipleQuestionsList = new Array()
        for(const multQuestion of resMultipleQuestion){
            console.log(multQuestion[3].startsWith('='))
            if(multQuestion[3].startsWith('=') || multQuestion[3].startsWith('~'))
            {
                const questionText = multQuestion[2].trim()
                const optionsText = multQuestion[3]
                const options = optionsText.split('\n')
                options.map((option)=>{
                    if(option.startsWith('=')){
                        const correct = option
                        const multipleQuestion = {
                            title: questionText,
                            optionsIncorrect: options.filter((o)=>o.trim().startsWith('~')),
                            correctOption: correct
                        }
                        multipleQuestionsList.push(multipleQuestion)
                    }
                })
            }
        }

        return multipleQuestionsList
    }

    return null
}

/**
 * 
 * @param {any[]} questionsList - Lista das questoes que serão enviadas para a api
 * @param {any[]} multipleQuestionList - Lista das questões estruturadas
 */
export function prepMultipleQuestion(questionsList,multipleQuestionList)
{
    
    multipleQuestionList.map((questionList) =>{
        var question
        question = {
            createItem:{
                item:{
                    title:questionList.title,
                    description:"Marque a alternativa correta",
                    questionItem:{
                        question:{
                            required:true,
                            grading:{
                                pointValue: 2,
                                correctAnswers:{
                                    answers: [
                                        {
                                            value:questionList.correctOption.trim().slice(1, questionList.correctOption.length)
                                        }
                                    ]
                                }
                            },
                            choiceQuestion:{
                                type:'RADIO',
                                options:[],
                                shuffle:true
                            }
                            }
            
                        }
                    },
                location:{
                    index:0
                }
            } 
        }

        questionList.optionsIncorrect.map((option) =>{
            question.createItem.item.questionItem.question.choiceQuestion.options.push({value: option.trim().slice(1)})
        })
        question.createItem.item.questionItem.question.choiceQuestion.options.push({value:questionList.correctOption.trim().slice(1)})
        questionsList.push(question)
    })
}


/**
 * 
 * @param {any[]} questionsList - Lista de questoes
 * @param {any[]} openQuestionList - Lista de questoes abertas
 */
export function prepOpenQuestions(questionsList, openQuestionList)
{

    if(openQuestionList != undefined)
        {
            var question
            for(var q of openQuestionList)
                console.log(q)
                question = {
                createItem:{
                    item:{
                        title:q.slice(7,q.length - 3),
                        description:"Disserte sobre",
                        questionItem:{
                            question:{
                                required:true,
                                textQuestion:{
                                    paragraph:true
                                    }
                                }
                
                            }
                        },
                    location:{
                        index:0
                    }
                }
            }
            questionsList.push(question)
        }
        
}

export function validDate(dateUser)
{
    const currDate = Date.now()

    if(dateUser >= currDate)
    {
        return true
    }
    else
    {
        return false
    }
}

/**
 * 
 * @param {OAuth2Client} oAuth - Autenticação
 * @param {str} name - Nome da avaliação 
 */
export async function createForm(oAuth, name){
    const form = google.forms({version: 'v1', auth: oAuth})
        const formWork = await form.forms.create({ 
            requestBody: {
                info: {
                    title: name,
                    documentTitle: name
                }
            }
                
        }     
    )
    console.log("Criando questoes")
    return formWork

    
}

/**
 * 
 * @param {forms_v1.Forms} formWork 
 * @param {OAuth2Client} oAuth
 * @param {any[]} questions 
 */
export async function addQuestionsForms(formId, oAuth, questions)
{
    const form = google.forms({version:"v1", auth: oAuth})
    form.forms.batchUpdate({
        formId: formId,
        requestBody:{
        requests:[{
            updateSettings:{
                settings: {
                    quizSettings:{
                        isQuiz: true
                    }
                },
                updateMask:"quizSettings.isQuiz"
            }
            
        }]}})

        form.forms.batchUpdate(
            {
                formId:formId,
                requestBody:{
                    requests:questions
            }
        }
        
        )

        console.log("Adicionando Questões")
}

/**
 * @param {str} name - Nome da atividade
 * @param {str} description - Descricao da atividade
 * @param {str} formId - ID do formulario
 * @param {str} dateEnd - Data do prazo
 * @param {oAuth2Client} oAUth - Autenticacao
 * @param {str} courseId - ID do curso 
 */
export async function createAssignment(name, description, formId, dateEnd, oAuth, courseId)
{ 
    const assignment = {
        title: name,
        description: description,
        workType: 'ASSIGNMENT',
        state: 'PUBLISHED',
        materials:[
        {
            link: {
                url:`https://docs.google.com/form/d/${formId}/formview`,
            }
        }],
        dueDate: { year: dateEnd.getFullYear(), month: dateEnd.getMonth()+1, day: dateEnd.getDate() },
        dueTime: { hours: 23, minutes: 59 }
    };

    
    const classroom = google.classroom({version:"v1", auth: oAuth})

    const courseWork =  await classroom.courses.courseWork.create({
        courseId:courseId,
        requestBody: assignment
    })
    
    console.log("Redirecionando para a atividade")
    return courseWork.data.alternateLink
}

export function prepTrueOrFalseQuest(questionsList, trueOrFalseList){
    if(trueOrFalseList != undefined){
        var question
        for(var q of trueOrFalseList){
            question = {
                createItem:{
                    item:{
                        title:q[1],
                        description:"Marque V ou F",
                        questionItem:{
                            question:{
                                required:true,
                                grading:{
                                    pointValue: 2,
                                    correctAnswers:{
                                        answers: [
                                            {
                                                value:q[2]
                                            }
                                        ]
                                    }
                                },
                                choiceQuestion:{
                                    type:'RADIO',
                                    options:[
                                        {value: "Verdadeiro"},
                                        {value: "Falso"}
                                    ],
                                    shuffle:true
                                }
                                }
                
                            }
                        },
                    location:{
                        index:0
                    }
                } 
            }
            questionsList.push(question)
        }
    }
}