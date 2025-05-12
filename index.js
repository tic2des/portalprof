//IMPORTACOES

import express from 'express'
import dotenv from 'dotenv'
import session from 'express-session'


import multer from 'multer'
import {Buffer} from 'node:buffer'
import flash from 'connect-flash'
import { prepareLogin, preparePassport, isLogged, loginOAuth, } from './login.js';
import { createAssignment, createForm, addQuestionsForms, getCourses, 
    getMultipleQuestions, prepMultipleQuestion, prepOpenQuestions, validDate, 
    prepTrueOrFalseQuest} from './formqparser.js'
//CONFIGURACOES

dotenv.config()

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

preparePassport(app)

//CONFIGURACAO DE MIDDLEWARES

app.use(express.static('public'))

app.use(express.urlencoded({ extended: true })); 

const login = prepareLogin(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)

//CONFIGURACAO DO EJS

app.set('view engine', 'ejs')
app.set('views', './views')




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
        
        const authClient= loginOAuth(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET, 
            req.user.accessToken,
            req.user.refreshToken,
            process.env.KEY_CRYPT
        )
        
        res.render('FormQParser', {courses: await getCourses(authClient), user : req.user, 
            date: currentDate.toLocaleDateString("en-CA"),
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
app.get('/auth/google', login.authenticate("google", {scope: ["profile", "email",
    "https://www.googleapis.com/auth/classroom.courses", 
    "https://www.googleapis.com/auth/forms.body", 
    "https://www.googleapis.com/auth/classroom.coursework.students"
 ]}))

app.get("/auth/google/callback", login.authenticate("google",{failureRedirect:"/", failureMessage: true, session: true}), (req, res) => {
    res.render('ApresentacaoPlus',{ title: "Gerador de apostilas para docentes", user : req.user})
})


app.post('/converter',upload.single('gift'), async (req,res) =>{
    if(isLogged(req))
    {   
        const nome_avaliacao = req.body.nome_avaliacao
        const gift = Buffer.from(req.file.buffer).toString()

        const openQuestions = gift.match(/^::(.*?)::(.+?)\s*\{\s*\s*}/gm)
        const tOrFQuestionsMatch = gift.matchAll(/::Q\d:: (.*){(Falso|Verdadeiro)}/gm)
        
        const multipleQuestionMatch = gift.matchAll(/^::(.*?)::(.+?)\s*\{\s*([\s\S]*?)\s*\}/gm)
        const multipleQuestion = getMultipleQuestions(multipleQuestionMatch)

        let questions = new Array()

        prepMultipleQuestion(questions, multipleQuestion)  
        prepOpenQuestions(questions, openQuestions)
        prepTrueOrFalseQuest(questions, tOrFQuestionsMatch)


        
        try{

            const dateEnd = new Date(req.body.data_prazo)
            

            if(!validDate(dateEnd))
            {
                req.flash("error","Data do prazo não pode ser no passado!")
                res.redirect("/formqparser")
            }
            const oAuth = loginOAuth(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET,
                req.user.accessToken, req.user.refreshToken,
                process.env.KEY_CRYPT)

            const formWork = await createForm(oAuth, nome_avaliacao)
            addQuestionsForms(formWork.data.formId, oAuth, questions)
            const linkAssignment = await createAssignment(req.body.nome_avaliacao, req.body.description, formWork.data.formId, dateEnd, oAuth, req.body.course_id)
            res.redirect(linkAssignment) 
        }catch(err)
        {
            console.log(err)
        }
    }
    else
    {
        console.log("Não autenticado, redirecionando...")
        res.redirect('auth/google')
    }
})

app.listen(port, () =>
{
    console.log("Aplicação rodando na porta "+port)
})

