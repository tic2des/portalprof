import GoogleStrategy from 'passport-google-oauth20'
import passport from 'passport'
import {google} from 'googleapis'

/**
 * 
 * @param {Express} app - O objeto do express 
 */
export function preparePassport(app){
    app.use(passport.initialize())
    app.use(passport.session())
}
/**
 * @param {str} googleClientId - O google client ID.
 * @param {str} googleClientSecret - O secret do google client.
 */
export function prepareLogin(googleClientId, googleClientSecret){
    const googleStrategy = GoogleStrategy.Strategy

    passport.use(
        new googleStrategy(
            {
                clientID: googleClientId,
                clientSecret: googleClientSecret,
                callbackURL: 'http://localhost:3000/auth/google/callback',
                scope:['profile', 
                    'email', 
                    'https://www.googleapis.com/auth/classroom.courses',
                    'https://www.googleapis.com/auth/forms.body',],
                accessType: 'offline',
                prompt:'consent'
            },
            async (accessToken, refreshToken, profile, done) => {
                const userData = {
                    accessToken,
                    refreshToken,
                    id:profile.id,
                    displayName: profile.displayName,
                    email: profile.emails[0].value,
                    photo: profile.photos[0].value

                }
                done(null, userData)
            }
        )
    )

    passport.serializeUser((user,done) =>{
        done(null,{
            id:user.id,
            displayName: user.displayName,
            email: user.email,
            photo: user.photo,
            accessToken: user.accessToken,
            refreshToken: user.refreshToken
        })
    })

    passport.deserializeUser((obj, done) => {
        done(null, obj)
    })

    return passport
}
 
/** 
  *  @param req - Request
**/
export function isLogged (req){
    if (!req.isAuthenticated() || !req.user)
    {
        return false
    }
    else
    {
        return true
    }
}

/**
 * 
 * @param {str} googleClientId - id do google client
 * @param {str} googleClientSecret -secret do google client
 * @param {str} accessToken - token de acesso
 * @param {str} refreshToken - token de atualizacao
 * @returns 
 */
export function loginOAuth(googleClientId, googleClientSecret, accessToken, refreshToken, cryptKey){
    const oauth2Client = new google.auth.OAuth2(
                googleClientId,
                googleClientSecret,
                'http://localhost:3000/auth/google/callback'
            )
    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
    })

    oauth2Client.on('tokens', (tokens) => {
        if (tokens.refresh_token) {
            oauth2Client.setCredentials(tokens);
        }
    });
    
    return oauth2Client
}

