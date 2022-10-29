import { object, string, TypeOf } from "zod";

export const createSessionSchema = object({
    body: object({
        password: string({
            required_error: 'Password is required',
        }).min(6, "Password is too short, should be a minimum of 6 characters"),
        email: string({
            required_error: 'Email is required'
        }).email('Not a valid email'),
    })
})

export type CreateSessionInput = TypeOf<typeof createSessionSchema>