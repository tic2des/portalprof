
import {engine} from 'express-handlebars'
import express from 'express'
const app = express()
const port = 3000

app.engine('handlebars', engine())

app.set('view engine', 'handlebars')
app.set('views', './views')
app.use(express.static('public'))



app.get('/',(req,res) =>{
    res.render('ApresentacaoPlus',{
        title:"Gerador de apostilas para docentes"
    })
})

app.get('/moodleqparser',(req,res) => {
    res.render('MoodleQParser', {
        title:"Moodle QParser"
    })
})

app.get('/tic2des',(req,res) =>{
    res.render('Tic2Des', {
        title:"Grupo de Pesquisa Tic2Des"
    })
})

app.listen(port, () =>
{
    console.log("Aplicação rodando na porta "+port)
})

