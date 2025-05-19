import express from 'express'
import dotenv from 'dotenv'
import axios from 'axios'

import { prepareLogin} from './utils/login.js'
import {isLogged} from './middleware/auth.js'

dotenv.config()
const router = express.Router()


const login = prepareLogin(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)


router.get('/', (req,res) => {
    res.render('Tic2Des', {title: 'Portal do Professor', user:req.user})
})


router.get('/profile', (req, res) => {
    if(isLogged(req))
    {
        res.render('Perfil', {title: 'Perfil do Usuário', user: req.user})
    }else{
        res.send('<h1>Acesso não autorizado<h1>')
    }
    
})

router.get('/apresentacaoplus', isLogged, (req, res) => {

    res.render('ApresentacaoPlus', {
        title: "Gerador de apostilas para docentes",
        user: req.user
    })
})

router.get('/formqparser', isLogged, async (req, res) => {
    let courses = null
    try{
        console.log(req.user)
        courses = await axios(
            {   
                headers:{
                    Accept:'application/json',
                    Authorization:`Bearer ${req.user.token}`
                },
                method:'GET',
                baseURL:'http://localhost:3000/api',
                url: '/formqparser', 
            }
        )
        console.log(courses)
    }catch(err){
        console.log(err)
    }
   

    const currentDate = new Date() 
    try{
        res.render('FormQParser',{title:"FormQParser",courses:courses.data.courses, date: currentDate.toLocaleDateString("en-CA")})
    }catch(err){
        console.log(err)
    }
        
    
})

router.get('/tic2des', (req, res) => {
    res.render('Tic2Des', {
        title: "Grupo de Pesquisa Tic2Des", 
        username: req.user.displayName,
        photo: req.user.photos[0].value,
        user: req.user
    })
})

router.get("/auth/google/callback", 
    login.authenticate("google", {
        failureRedirect: "/"
    }), 
    (req, res) => {
        res.redirect('/formqparser')
    }
)



export default router