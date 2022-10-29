import { DocumentDefinition, FilterQuery, QueryOptions, UpdateQuery } from "mongoose";

import logger from '../utils/logger'
import UserModel, { UserDocument } from "../models/user.model";
import { omit } from "lodash"
import config from "config"
import axios from 'axios'
import qs from "qs";

export async function createUser(input: DocumentDefinition<Omit<UserDocument, 'createdAt' | 'updatedAt' | 'comparePassword' | 'picture'>>){
    try {
        const user = await UserModel.create(input)

        return omit(user.toJSON(), 'password' )
    } catch (error: any) {
        throw new Error(error)
    }
}

export async function validatePassword({email, password}: {email: string, password: string}) {
    try {
        const user = await UserModel.findOne({email})

        if (!user) return false
    
        const isValid = await user.comparePassword(password)

        if(!isValid) return false
        
        return omit(user.toJSON(), 'password')
    } catch (error: any) {
        throw new Error(error)
    }
}

export async function findUser(query: FilterQuery<UserDocument>) {
    return UserModel.findOne(query).lean()
}

interface GoogleTokensResult {
    access_token: string
    expires_in: string
    refresh_token: string
    scope: string
    id_token: string
}

export async function getGoogleOAuthTokens({ code }: { code: string}): Promise<GoogleTokensResult> {
    const url = 'https://oauth2.googleapis.com/token'

    const values = {
        code,
        client_id: config.get('googleClientId'),
        client_secret: config.get('googleClientSecret'),
        redirect_uri: config.get('googleOauthRedirectUrl'),
        grant_type: 'authorization_code'
    }

    try {
        const res = await axios.post<GoogleTokensResult>(url, qs.stringify(values), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        })
    
        return res.data
    } catch (error: any) {
        logger.info(error, 'Failed to fetch Google Oauth Tokens')
        throw new Error(error.message)
    }
}

interface GoogleUserResult {
    id: string
    email: string
    verified_email: string
    name: string
    given_name: string
    family_name: string
    picture: string
    locale: string
}

export async function getGoogleUser({ id_token, access_token }: { id_token: string, access_token: string}): Promise<GoogleUserResult> {
    try {
        const res = await axios.get<GoogleUserResult>(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`, {
            headers: {
                'Authorization': `Bearer ${id_token}`
            }
        })

        return res.data
    } catch (error: any) {
        logger.error(error, 'Error fetching google user')
        throw new Error(error.message)
    }
}

export async function findAndUpdateGoogleUser(query: FilterQuery<UserDocument>, update: UpdateQuery<UserDocument>, options: QueryOptions = {}): Promise<UserDocument | null> {
    const user = await UserModel.findOneAndUpdate(query, update, options)
    return user
}


interface FacebookTokensResult {
    access_token: string
    expires_in: string
    auth_type: string
    token_type: string
}
export async function getFacebookOAuthTokens({ code }: { code: string}): Promise<FacebookTokensResult> {
    const url = 'https://graph.facebook.com/v15.0/oauth/access_token'

    const values = {
        code,
        client_id: config.get('facebookAppId'),
        client_secret: config.get('facebookAppSecret'),
        redirect_uri: config.get('facebookOauthRedirectUrl'),
        grant_type: 'authorization_code'
    }

    try {
        const res = await axios.post<FacebookTokensResult>(url, qs.stringify(values), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        })
    
        return res.data
    } catch (error: any) {
        logger.info(error, 'Failed to fetch Facebook Oauth Tokens')
        throw new Error(error.message)
    }
}

interface FacebookUserResult {
    id: string
    email: string
    name: string
    picture: string
    locale: string
}

export async function getFacebookUser({ access_token }: { access_token: string}): Promise<FacebookUserResult> {
    try {
        const res = await axios.get<FacebookUserResult>(`https://graph.facebook.com/v15.0/me?fields=id%2Cname%2Cemail&access_token=${access_token}`)
        return res.data


    } catch (error: any) {
        logger.error(error, 'Error fetching facebook user')
        throw new Error(error.message)
    }
}
