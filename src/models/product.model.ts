import mongoose from "mongoose";
import { UserDocument } from "./user.model";
import {v4 as uuidv4} from 'uuid'

// const nanoid = require('nanoid')
// import {customAlphabet} from 'nanoid'
// const nanoidGenerator = nanoid.customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10)

export interface ProductDocument extends mongoose.Document {
    user: UserDocument['_id'],
    title: string,
    description: string,
    price: number,
    image: string
    createdAt: Date,
    updatedAt: Date,
}


const productSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    productId: {
        type: String,
        // required: true,
        unique: true,
        // default: () => `product_${nanoidGenerator()}`
        default: () => uuidv4()
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
})

const ProductModel = mongoose.model<ProductDocument>('Product', productSchema)

export default ProductModel 