import express from 'express'
import dotenv from 'dotenv'
import { prepareLogin, loginOAuth } from './utils/login.js'
import { createAssignment, createForm, addQuestionsForms, getMultipleQuestions, 
    prepMultipleQuestion, prepOpenQuestions, validDate, prepTrueOrFalseQuest,getCourses } from './utils/formqparser.js'
import multer from 'multer'
import { verifyToken, isLogged} from './middleware/auth.js'
dotenv.config()
const router = express.Router()
const storage = multer.memoryStorage()
const upload = multer({ storage: storage})

const login = prepareLogin(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.SECRET)

//Rota base
router.get('/', (req, res) => {
    res.json({user: req.user})
})


//Rota de login com google
router.get('/auth/google', login.authenticate("google", {
    scope: [
        "profile", 
        "email",
        "https://www.googleapis.com/auth/classroom.courses", 
        "https://www.googleapis.com/auth/forms.body", 
        "https://www.googleapis.com/auth/classroom.coursework.students"
    ]
}))


//Rota do FOrmQParser
router.get('/formqparser', verifyToken, async (req,res)=>{
    try {
      
        const authClient = loginOAuth(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET, 
            req.user.access_token,
            req.user.refresh_token,
            process.env.KEY_CRYPT
        )
        
        res.json({
            courses: await getCourses(authClient)
        })
    } catch(err) {
        console.log(err)
    }

        
})


//Rota de Logout
router.post('/logout', isLogged, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Erro ao fazer logout')
        }
        res.redirect('/')
    })
})


//Rota que que converte e cria o formulario
router.post('/converter', verifyToken, upload.single('gift'), async (req, res) => {
    if(isLogged(req)) {   
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

        try {
            const dateEnd = new Date(req.body.data_prazo)
            
            if(!validDate(dateEnd)) {
                req.flash("error", "Data do prazo não pode ser no passado!")
                res.redirect("/formqparser")
            }
            
            const oAuth = loginOAuth(
                process.env.GOOGLE_CLIENT_ID, 
                process.env.GOOGLE_CLIENT_SECRET,
                req.user.accessToken, 
                req.user.refreshToken,
                process.env.KEY_CRYPT
            )

            const formWork = await createForm(oAuth, nome_avaliacao)
            addQuestionsForms(formWork.data.formId, oAuth, questions)
            const linkAssignment = await createAssignment(
                req.body.nome_avaliacao, 
                req.body.description, 
                formWork.data.formId, 
                dateEnd, 
                oAuth, 
                req.body.course_id
            )
            res.redirect(linkAssignment) 
        } catch(err) {
            console.log(err)
        }
    } else {
        console.log("Não autenticado, redirecionando...")
        res.redirect('auth/google')
    }
})

export default router