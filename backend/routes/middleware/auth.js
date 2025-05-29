import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()
const {verify, sign} = jwt

export const isLogged = (req, res, next)=>{
    if(req.isAuthenticated()){

        req.photo = req.user.photo
        req.displayName = req.user.displayName
        req.email = req.user.email
        return next()

    }
    res.status(401).send("<h1>Acesso não autorizado</h1>")
}

export const verifyToken = (req, res, next)=>
{
    const authHeader = req.headers['authorization'];
    var token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]; 
    }
    const token_decoded = verify(token, process.env.SECRET,(err, decoded)=>{
        if(err){
            console.log(err)
            res.json({Erro:'Token inválido'})
        }
        req.user = decoded
        return next()
    })

}