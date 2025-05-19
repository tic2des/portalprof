import express from 'express'
import dotenv from 'dotenv'
import session from 'express-session'
import viewsRouter from './routes/views.js'
import apiRouter from './routes/api.js'
import { preparePassport } from './routes/utils/login.js'


dotenv.config()
const app = express()
const port =  3000

// Configurações de middleware


app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 24*60*60*1000
    }
}))

app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
preparePassport(app)


app.set('view engine', 'ejs')
app.set('views', './views')

app.use('/', viewsRouter)
app.use('/api', apiRouter) 
app.listen(port, () => {
    console.log("Aplicação rodando na porta " + port)
})