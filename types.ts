import {Prisma} from './generated/prisma-client'
import {stringArg, core, intArg} from "nexus";

//定义一个上下文接口，具有Prisma类型的prisma-client，和any类型的http请求
export interface Context {
    prisma:Prisma
    request:any
}

export function requiredString(opts: core.ScalarArgConfig<string>){
    return stringArg({ ...opts, required: true });
}

export function requiredInt(opts: core.ScalarArgConfig<number>) {
    return intArg({...opts,required:true});
}