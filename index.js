//IMPORTACOES

import {engine} from 'express-handlebars'
import express from 'express'
import dotenv from 'dotenv'
import session from 'express-session'
import GoogleStrategy from 'passport-google-oauth20'
import passport from 'passport'
import { google } from 'googleapis';
//CONFIGURACOES

dotenv.config()
const googleStrategy = GoogleStrategy.Strategy
const app = express()
const port = 3000

//


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


passport.use(
    new googleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: 'http://localhost:3000/auth/google/callback',
            scope:['profile', 'email', 'https://www.googleapis.com/auth/classroom.courses.readonly'],
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
        user: req.user.displayName,
        photo:req.user.photos[0].value
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
        res.render('FormQParser', {courses: courses.data.courses, user: req.user.displayName,
            photo:req.user.photos[0].value})
    }catch(err)
    {
        console.log(err)
    }
})

//ROTA DO TIC2DES
app.get('/tic2des',(req,res) =>{
    res.render('Tic2Des', {
        title:"Grupo de Pesquisa Tic2Des", user: req.user.displayName,
        photo:req.user.photos[0].value
    })
})

//ROTA DE LOGIN DO GOOGLE
app.get('/auth/google', passport.authenticate("google", {scope: ["profile", "email","https://www.googleapis.com/auth/classroom.courses.readonly"]}))

app.get("/auth/google/callback", passport.authenticate("google",{failureRedirect:"/", failureMessage: true, session: true}), (req, res) => {
    res.render('ApresentacaoPlus',{ title: "Gerador de apostilas para docentes", user : req.user.displayName, photo : req.user.photos[0].value})
})

app.listen(port, () =>
{
    console.log("Aplicação rodando na porta "+port)
})

