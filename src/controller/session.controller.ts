import {CookieOptions, Request, Response} from 'express'
import config from 'config'

import { createSession, findSessions, updateSessions } from '../service/session.service'
import { findAndUpdateGoogleUser, getFacebookOAuthTokens, getFacebookUser, getGoogleOAuthTokens, getGoogleUser, validatePassword } from '../service/user.service'
import { signJWT } from '../utils/jwt.utils'
import { CreateSessionInput } from '../schema/session.schema'
import logger from '../utils/logger'


const accessTokenCookieOptions: CookieOptions = {
    maxAge: 900000, // 15 mins
    httpOnly: true,
    domain: process.env.NODE_ENV === 'production' ? config.get<string>('cookieDomain') : 'localhost',
    path: '/',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    secure: process.env.NODE_ENV === 'production'
}

const refreshTokenCookieOptions = {
    ...accessTokenCookieOptions,
    maxAge: 3.154e10, // 1 year
}

export async function createSessionHandler(req: Request<{}, {}, CreateSessionInput['body']>, res: Response){
    // validate password
    const user = await validatePassword(req.body)
    if(!user){
        return res.status(401).send('Invalid email or password')
    }

    // create a session
    const session = await createSession(user._id, req.get('user-agent') || '')

    // create an access token
    const accessToken = signJWT(
        {...user, session: session._id},
        {expiresIn: config.get('accessTokenTtl')} // 15 minutes
    );

    // create an refresh token
    const refreshToken = signJWT(
        {...user, session: session._id},
        { expiresIn: config.get('refreshTokenTtl')} // 1 year
    );

    // Set tokens on cookies
    res.cookie('accessToken', accessToken, accessTokenCookieOptions)
    
    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions)

    // return access and refresh tokens
    return res.send({ accessToken, refreshToken})
}

export async function getUserSessionsHandler (_req: Request, res: Response) {
    const userId = res.locals.user._id    
    const sessions = await findSessions({user: userId, valid: true})

    return res.send(sessions)
}

export async function deleteSessionsHandler (_req: Request, res: Response) {
    const user = res.locals.user
    await updateSessions({_id: user.session}, {valid: false})
    
    return res.send({
        accessToken: null,
        refreshToken: null
    })
}

export async function googleOauthHandler(req: Request, res: Response) {
    try {
        // get the code from qs
        const code = req.query.code as string

        // get id and access tokens
        const { id_token, access_token } = await getGoogleOAuthTokens({code})

        // get user with token and jwt
        // const googleUser = jwt.decode(id_token)

        // get user by making get request
        const googleUser = await getGoogleUser({id_token, access_token})
        
        if(!googleUser.verified_email){
            return res.status(403).send('Google account not verified')
        }

        // upsert user
        const user = await findAndUpdateGoogleUser({
            email: googleUser.email,
        }, {
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture
        }, {
            upsert: true,
            new: true
        })

        if(!user){
            return res.status(403).send('User not found')
        }

        // create a session
        const session = await createSession(user._id, req.get('user-agent') || '')

        // create an access token
        const accessToken = signJWT(
            {...user, session: session._id},
            {expiresIn: config.get('accessTokenTtl')} // 15 minutes
        );

        // create an refresh token
        const refreshToken = signJWT(
            {...user, session: session._id},
            { expiresIn: config.get('refreshTokenTtl')} // 1 year
        );

        // Set tokens on cookies
        res.cookie('accessToken', accessToken, accessTokenCookieOptions)
        res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions)

        // redirect back to client
        return res.redirect(config.get('clientOrigin'))
    } catch (error: any) {
        logger.error(error, 'My request failed oh!')
        return res.redirect(`${config.get('clientOrigin')}/oauth/error`)
    }
} 

export async function facebookOauthHandler(req: Request, res: Response) {
    // get the code from qs
    const code = req.query.code as string

     // get id and access tokens
     const { token_type, access_token, expires_in } = await getFacebookOAuthTokens({code})

    // get user by making get request
    const facebookUser = await getFacebookUser({access_token})
       
    console.log(facebookUser)
   
    if(!facebookUser.email){
        return res.status(403).send('Google account not verified')
    }

    // upsert user
    const user = await findAndUpdateGoogleUser({
        email: facebookUser.email,
    }, {
        email: facebookUser.email,
        name: facebookUser.name,
        picture: facebookUser.picture
    }, {
        upsert: true,
        new: true
    })

    if(!user){
        return res.status(403).send('User not found')
    }

     // create a session
     const session = await createSession(user._id, req.get('user-agent') || '')

     // create an access token
     const accessToken = signJWT(
         {...user, session: session._id},
         {expiresIn: config.get('accessTokenTtl')} // 15 minutes
     );

     // create an refresh token
     const refreshToken = signJWT(
         {...user, session: session._id},
         { expiresIn: config.get('refreshTokenTtl')} // 1 year
     );

     // Set tokens on cookies
     res.cookie('accessToken', accessToken, accessTokenCookieOptions)
     res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions)

     // redirect back to client
     return res.redirect(config.get('clientOrigin'))
}