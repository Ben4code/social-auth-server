import {Request, Response} from 'express'

import logger from '../utils/logger'
import { CreateProductInput, DeleteProductInput, GetProductInput, UpdateProductInput } from '../schema/product.schema';
import { createProduct, deleteProduct, findAndUpdateProduct, findProduct } from '../service/product.service';


export async function createProductHandler(req: Request<{}, {}, CreateProductInput['body']>, res: Response){
    const userId = res.locals.user._id
    const body = req.body
    try {
        const product = await createProduct({...body, user: userId})
        return res.send(product)    
    } catch (error) {
        logger.info('production creation failed.')
        res.status(403).send(error)
    }
    
}

export async function getProductHandler(req: Request<GetProductInput['params']>, res: Response){
    const productId = req.params.productId
    const product = await findProduct({productId})

    if(!product){
        return res.status(404).send('you F-ed up')
    }

    return res.status(200).send(product)
}


export async function updateProductHandler(
    req: Request<UpdateProductInput['params'], {}, UpdateProductInput['body']>,
    res: Response)
{
    const userId = res.locals.user._id
    const productId = req.params.productId
    const product = await findProduct({productId})
    const update = req.body

    if(!product){
        return res.sendStatus(404)
    }

    if(String(product.user) !== userId){
        return res.sendStatus(403)
    }

    const updatedProduct = await findAndUpdateProduct({productId}, update, {
        new: true
    })

    return res.status(200).send(updatedProduct)
}

export async function deleteProductHandler(req: Request<DeleteProductInput['params']>, res: Response){
    console.log('first')
    const userId = res.locals.user._id
    const productId = req.params.productId
    const product = await findProduct({productId})

    if(!product){
        return res.sendStatus(404)
    }

    if(String(product.user) !== userId){
        return res.sendStatus(403)
    }

    await deleteProduct({ productId })

    return res.status(201).send(product)
}