import {Request, Response, NextFunction} from 'express'
import {get, result} from 'lodash'
import config from 'config'
import { reIssueAccessToken } from '../service/session.service'
import { verifyJWT } from '../utils/jwt.utils'

const desesializeUser = async (req: Request, res: Response, next: NextFunction) => {
    const accessToken: string = get(req, 'cookies.accessToken') || get(req, "headers.authorization", "").replace(/^Bearer\s/, "")
    
    const refreshToken: string = get(req, "headers.x-refresh", "")
    
    if(!accessToken) return next()
    
    const {decoded, expired} = verifyJWT(accessToken)

    if(decoded){
        res.locals.user = decoded
        return next()
    }

    // if access token is invalid.
    if(expired && refreshToken){
        const newAccessToken = await reIssueAccessToken(refreshToken)

        if(newAccessToken){
            res.setHeader('x-access-token', newAccessToken)

            res.cookie('accessToken', newAccessToken, {
                maxAge: 900000, // 15 mins
                httpOnly: true,
                domain: process.env.NODE_ENV === 'production' ? config.get('cookieDomain') : 'localhost',
                path: '/',
                sameSite: 'strict',
                secure: process.env.NODE_ENV === 'production'
            })

            const result = verifyJWT(newAccessToken)

            res.locals.user = result.decoded
            return next()
        }
    }
    return next()
}

export default desesializeUser