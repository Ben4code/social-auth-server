import {Express, Request, Response} from 'express'

import validateResource from  './middleware/validateResource'
import { createUserHandler, getUserHandler } from './controller/user.controller'
import { createUserSchema } from './schema/user.schema'
import { createSessionHandler, deleteSessionsHandler, facebookOauthHandler, getUserSessionsHandler, googleOauthHandler } from './controller/session.controller'
import { createSessionSchema } from './schema/session.schema'
import requireUser from './middleware/requireUser'
import { createProductSchema, deleteProductSchema, getProductSchema, updateProductSchema } from './schema/product.schema'
import { createProductHandler, deleteProductHandler, getProductHandler, updateProductHandler } from './controller/Product.controller'

function routes(app: Express) {
    app.get('/health', (req: Request, res: Response) => {
        return res.sendStatus(200)
    })

    // User routes
    app.post('/api/users', validateResource(createUserSchema), createUserHandler)
    app.get('/api/me', requireUser, getUserHandler)
    
    // Session routes
    app.post('/api/sessions', validateResource(createSessionSchema), createSessionHandler)
    app.get('/api/sessions', requireUser, getUserSessionsHandler)
    app.delete('/api/sessions', requireUser, deleteSessionsHandler)
   
    // Session Google Auth
    app.get('/api/sessions/oauth/google', googleOauthHandler)
    
    // Session Facebook Auth
    app.get('/api/sessions/oauth/facebook', facebookOauthHandler)

    // Product routes
    app.post('/api/products', [requireUser, validateResource(createProductSchema)], createProductHandler)
    app.get('/api/products/:productId', validateResource(getProductSchema), getProductHandler)
    app.put('/api/products/:productId', [requireUser, validateResource(updateProductSchema)], updateProductHandler)
    app.delete('/api/products/:productId', [requireUser, validateResource(deleteProductSchema)], deleteProductHandler)
}

export default routes