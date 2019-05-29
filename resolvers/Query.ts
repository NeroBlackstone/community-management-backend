import {getUserId} from "../utils";
import {prismaObjectType} from "nexus-prisma";
import {requiredId} from "../types";
import {Activity, Advice} from "../generated/prisma-client";

//prismaObjectType暴露基于数据模型的Object Type
export const Query = prismaObjectType({
    name:'Query',
    definition(t){
        t.prismaFields(['*']);
        t.field('me',{
            type: 'User',
            //字段的解析器方法
            resolve: (root, args, context) => {
                const userId=getUserId(context);
                return context.prisma.user({id:userId});
            }
        });
        t.list.field('uploads',{
            type: 'File',
            resolve:async (root,args,context)=>await context.prisma.files()
        })
    },
});