//IMPORTACOES

import express from 'express'
import dotenv from 'dotenv'
import session from 'express-session'
import GoogleStrategy from 'passport-google-oauth20'
import passport from 'passport'
import { google } from 'googleapis';
import multer from 'multer'
import {Buffer} from 'node:buffer'
import flash from 'connect-flash'
//CONFIGURACOES

dotenv.config()
const googleStrategy = GoogleStrategy.Strategy
const app = express()
const port = 3000

const storage = multer.memoryStorage()
const upload = multer({ storage: storage})


app.use(session({
    secret:process.env.SECRET,
    resave: false,
    saveUninitialized: true
}))
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())

//CONFIGURACAO DE MIDDLEWARES

app.use(express.static('public'))

app.use(express.urlencoded({ extended: true })); 

passport.use(
    new googleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: 'http://localhost:3000/auth/google/callback',
            scope:['profile', 
                'email', 
                'https://www.googleapis.com/auth/classroom.courses',
                'https://www.googleapis.com/auth/forms.body',],
            accessType: 'offline',
            prompt:'consent'
        },
        async (accessToken, refreshToken, profile, done) => {
            profile.accessToken = accessToken
            profile.refreshToken = refreshToken
            done(null, profile)
        }
    )
)


passport.serializeUser((user, done) => { 
    done(null,user)

})
passport.deserializeUser((user, done) => { 
    done(null,user)
})

//CONFIGURACAO DO EJS

app.set('view engine', 'ejs')
app.set('views', './views')



function isLogged (req){
    if (!req.isAuthenticated() || !req.user)
    {
        return false
    }
    else
    {
        return true
    }
}
//ROTA BASE

app.get('/',(req,res) => {
    res.render('Tic2Des', {title:"Portal do Professor"})
})

app.get('/apresentacaoplus',(req,res) =>{
    if(!isLogged(req))
    {
        console.log('Usuário não autenticado, redirecionando...');
        return res.redirect('/auth/google');
    }

    res.render('ApresentacaoPlus',{
        title:"Gerador de apostilas para docentes",
        username: req.user.displayName,
        photo:req.user.photos[0].value,
        user: req.user
    })
})

//ROTA DO FORM QPARSER

app.get('/formqparser', async (req,res) => {
    if (!isLogged(req)) {
        console.log('Usuário não autenticado, redirecionando...');
        return res.redirect('/auth/google');
    }

    try{
        const currentDate = new Date()
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'http://localhost:3000/auth/google/callback'
        )
        console.log(req.user)
        oauth2Client.setCredentials({
            access_token: req.user.accessToken,
            refresh_token: req.user.refreshToken
        })
        const classroom =  google.classroom({ version: 'v1', auth: oauth2Client });

        const courses = await classroom.courses.list({
            teacherId: 'me',
            pageSize: 10
        })

        console.log(courses.data.courses)
        res.render('FormQParser', {courses: courses.data.courses, username: req.user.displayName,
            photo:req.user.photos[0].value, user : req.user, 
            date: currentDate.toLocaleDateString("en-CA"),
            messages: req.flash('error'),
            title:"FormQParser"})
    }catch(err)
    {
        console.log(err)
    }
})

//ROTA DO TIC2DES
app.get('/tic2des',(req,res) =>{
    res.render('Tic2Des', {
        title:"Grupo de Pesquisa Tic2Des", username: req.user.displayName,
        photo:req.user.photos[0].value,
        user: req.user
    })
})

//ROTA DE LOGIN DO GOOGLE
app.get('/auth/google', passport.authenticate("google", {scope: ["profile", "email",
    "https://www.googleapis.com/auth/classroom.courses", 
    "https://www.googleapis.com/auth/forms.body", 
    "https://www.googleapis.com/auth/classroom.coursework.students"
 ]}))

app.get("/auth/google/callback", passport.authenticate("google",{failureRedirect:"/", failureMessage: true, session: true}), (req, res) => {
    res.render('ApresentacaoPlus',{ title: "Gerador de apostilas para docentes", username : req.user.displayName, photo : req.user.photos[0].value, user:req.user})
})


app.post('/converter',upload.single('gift'), async (req,res) =>{
    const REopenQuestion= new RegExp("(.+){}","gm")
    const REtrueOrFalse = new RegExp("(.+)({F}|{V})","gm")
    const REcorrectAnswer = new RegExp("(.*?\\?)[\\s\\S]*?\\{([\\s\\S]*?)\\}", "gm")
    const gift = Buffer.from(req.file.buffer).toString()

    const openQuestions = gift.match(REopenQuestion)
    const trueOrFalse = gift.match(REtrueOrFalse)
    const correctQuestion = gift.matchAll(REcorrectAnswer)
    
    let multipleQuestionsList = new Array()

    for(const corrQ of correctQuestion){
        console.log(corrQ)
        const questionText = corrQ[1].trim()
        const optionsText = corrQ[2]
        const options = optionsText.split('\n')
        console.log(optionsText)
        options.map((option)=>{
            if(option.startsWith('=')){
                const correct = option
                const multipleQuestion = {
                    title: questionText,
                    optionsIncorrect: options.filter((o)=>o.startsWith('~')),
                    correctOption: correct
                }
                multipleQuestionsList.push(multipleQuestion)
            }
        })
    }

    let requestForm = {info: {
        title: 'Meu Formulário via Node.js',
        documentTitle: 'Pesquisa de Satisfação'
      }}
    console.log(JSON.stringify(multipleQuestionsList))
    let questions = []
    var question
    multipleQuestionsList.map((questionList) =>{
        
        
        question = {
            createItem:{
                item:{
                    title:questionList.title,
                    description:"Marque a alternativa correta",
                    questionItem:{
                        question:{
                            required:true,
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
            question.createItem.item.questionItem.question.choiceQuestion.options.push(option.slice(1, option.length-3))
        })
        question.createItem.item.questionItem.question.choiceQuestion.options.push(questionList.correctOption)
        questions.push(question)
    })

    openQuestions.map((q) => {
        question = {
        createItem:{
            item:{
                title:q.slice(0, q.length - 2),
                description:"Disserte sobre",
                questionItem:{
                    question:{
                        required:true,
                        textQuestion:{
                            paragraph:false
                            }
                        }
        
                    }
                },
            location:{
                index:0
            }
        }
    }
        questions.push(question)
    })
    
    try{

        const data_prazo = new Date(req.body.data_prazo)
        const currDate = Date.now()

        if(data_prazo < currDate)
        {
            req.flash("error","Data do prazo não pode ser no passado!")
            res.redirect("/formqparser")
        }
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'http://localhost:3000/auth/google/callback'
        )

        oauth2Client.setCredentials({
            access_token: req.body.accessToken,
            refresh_token: req.body.refreshToken
        })
        const form = google.forms({version: 'v1', auth: oauth2Client})
        const formWork = await form.forms.create({ 
            requestBody: {
                info: {
                    title: 'Meu Formulário via Node.js',
                    documentTitle: 'Pesquisa de Satisfação'
                  }
                }
                
            }     
        )
        console.log("QUESTOES")
        console.log(JSON.stringify(questions))

        const addQuestions = await form.forms.batchUpdate(
            {
                formId:formWork.data.formId,
                requestBody:{
                    requests:questions
            }
        }
    )
        
        

        const assignment = {
            title: req.body.nome_avaliacao,
            description: req.body.descricao,
            workType: 'ASSIGNMENT',
            state: 'PUBLISHED',
            materials:[
            {
                link: {
                    url:`https://docs.google.com/form/d/${formWork.data.formId}/formview`,
                }
            }],
            dueDate: { year: data_prazo.getFullYear(), month: data_prazo.getMonth()+1, day: data_prazo.getDate() },
            dueTime: { hours: 23, minutes: 59 }
        };

        const classroom = google.classroom({version:"v1", auth: oauth2Client})

        const courseWork =  await classroom.courses.courseWork.create({
            courseId:req.body.course_id,
            requestBody: assignment
        })
        res.redirect(courseWork.data.alternateLink)
    }catch(err)
    {
        console.log(err)
    }
    
})

app.listen(port, () =>
{
    console.log("Aplicação rodando na porta "+port)
})

