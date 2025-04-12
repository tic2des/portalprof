//IMPORTACOES

import {engine} from 'express-handlebars'
import express from 'express'
import dotenv from 'dotenv'
import session from 'express-session'
import GoogleStrategy from 'passport-google-oauth20'
import passport from 'passport'
import { google } from 'googleapis';
import multer from 'multer'
import {Buffer} from 'node:buffer'
//CONFIGURACOES

dotenv.config()
const googleStrategy = GoogleStrategy.Strategy
const app = express()
const port = 3000

const storage = multer.memoryStorage()
const upload = multer({ storage: storage})


app.use(session({
    cookie: {
       maxAge: 24 * 60 * 60 * 1000,
       secure:false
    },
    secret:process.env.SECRET,
    resave: false,
    saveUninitialized: true
}))

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

//CONFIGURACAO DO HANDLEBARS
app.engine('handlebars', engine())

app.set('view engine', 'handlebars')
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
    res.render('Tic2Des')
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
            photo:req.user.photos[0].value, user : req.user})
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
   
    const gift = Buffer.from(req.file.buffer).toString()
    console.log(gift)
    try{
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
        const id = await form.forms.create({
            requestBody: {
              info: {
                title: 'Meu Formulário via Node.js',
                documentTitle: 'Pesquisa de Satisfação'
              }
            }
        }
        )
        
        const assignment = {
            title: 'Atividade de Exemplo',
            description: 'Esta é uma atividade criada via API',
            workType: 'ASSIGNMENT',
            state: 'PUBLISHED',
            dueDate: { year: 2025, month: 11, day: 30 },
            dueTime: { hours: 23, minutes: 59 }
        };

        const classroom = google.classroom({version:"v1", auth: oauth2Client})

        classroom.courses.courseWork.create({
            courseId:req.body.course_id,
            requestBody: assignment
        })
        res.send('ok')
    }catch(err)
    {
        console.log(err)
    }
    
})

app.listen(port, () =>
{
    console.log("Aplicação rodando na porta "+port)
})

