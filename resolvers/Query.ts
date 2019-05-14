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
        t.list.field('getAdvicesByRole',{
            type:'Advice',
            args:{
                id:requiredId({})
            },
            resolve:async (root,{id},context)=>{
                const user=await context.prisma.user({id});
                let advices:Advice[];
                if (user.role==='RESIDENT'){
                    advices= await context.prisma.advices({where:{owner:{id}}})
                }else{
                    advices= await context.prisma.advices()
                }
                return advices
            }
        });
        t.list.field('getActivitiesByRole',{
            type:'Activity',
            args:{
                id:requiredId({})
            },
            resolve:async (root,{id},context)=>{
                const user=await context.prisma.user({id});
                let activities:Activity[];
                if (user.role==='RESIDENT'){
                    activities=await context.prisma.activities({where:{owner:{id}}});
                }else {
                    activities=await context.prisma.activities()
                }
                return activities
            }
        });
    },
});