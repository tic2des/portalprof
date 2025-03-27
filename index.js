//IMPORTACOES

import {engine} from 'express-handlebars'
import express from 'express'
import dotenv from 'dotenv'
import session from 'express-session'
import GoogleStrategy from 'passport-google-oauth20'
import passport from 'passport'

//CONFIGURACOES
dotenv.config()
const googleStrategy = GoogleStrategy.Strategy
const app = express()
const port = 3000

//
app.use(session({
    secret:'secret',
    resave: false,
    saveUninitialized: true
}))

//CONFIGURACAO DE MIDDLEWARES
app.use(passport.initialize())
app.use(passport.session())
app.use(express.static('public'))

passport.use(
    new googleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: 'http://localhost:3000/auth/google/callback'
        },
        (accessToken, refreshToken, profile, done) => {
            return done(null, profile)
        }
    )
)


passport.serializeUser((user, done) => { done(null, user)})
passport.deserializeUser((user, done) => { done(null, user)})

//CONFIGURACAO DO HANDLEBARS
app.engine('handlebars', engine())

app.set('view engine', 'handlebars')
app.set('views', './views')



//ROTA BASE
app.get('/',(req,res) =>{
    res.render('ApresentacaoPlus',{
        title:"Gerador de apostilas para docentes",
        username: "Fazer login com o google"
    })
})

//ROTA DO FORM QPARSER
app.get('/formqparser',(req,res) => {
    res.render('FormQParser', {
        title:"Form QParser"
    })
})

//ROTA DO TIC2DES
app.get('/tic2des',(req,res) =>{
    res.render('Tic2Des', {
        title:"Grupo de Pesquisa Tic2Des"
    })
})

//ROTA DE LOGIN DO GOOGLE
app.get('/auth/google', passport.authenticate("google", {scope: ["profile", "email"]}))

app.get("/auth/google/callback", passport.authenticate("google",{failureRedirect:"/"}), (req, res) => {
    res.render('ApresentacaoPlus',{ username : req.user.displayName})
})

app.listen(port, () =>
{
    console.log("Aplicação rodando na porta "+port)
})

