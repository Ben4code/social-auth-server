import express from "express";
import cors from 'cors'
import cookieParser from "cookie-parser";

import routes from './routes'
import config from 'config'
import dotenv from 'dotenv'
import logger from './utils/logger'
import dbConnect from './utils/connect'
import desesializeUser from "./middleware/deserializeUser";

dotenv.config()
const app = express()
const port = config.get<number>('port')

app.use(cors({
    origin: config.get('clientOrigin'),
    credentials: true,
}))
app.use(cookieParser())

app.use(express.json())
app.use(desesializeUser)

app.listen(port, async () => {
    logger.info('App is running on http://localhost:' + port)
    
    await dbConnect()
    
    routes(app)
})