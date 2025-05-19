import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()
const {verify, sign} = jwt

export const isLogged = (req, res, next)=>{
    if(req.isAuthenticated() || req.user) return next()
    res.status(401).json({message: "Acesso não autorizado"})
}

export const verifyToken = (req, res, next)=>
{
    const authHeader = req.headers['authorization'];
    console.log(req.headers)
    console.log(`Cabecalho ${authHeader}`)
    var token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]; 
      console.log(`Token capturado ${token}`)
    }
    const token_decoded = verify(token, process.env.SECRET,(err, decoded)=>{
        if(err){
            console.log(err)
            res.json({Erro:'Token inválido'})
        }
        console.log(decoded)
        req.user = decoded
        return next()
    })

}