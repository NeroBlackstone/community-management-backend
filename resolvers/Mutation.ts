import {prismaObjectType} from "nexus-prisma";
import { hash, compare } from 'bcrypt'
import {arg, idArg, intArg, stringArg} from "nexus";
import { APP_SECRET} from '../utils'
import { sign } from 'jsonwebtoken'
import {Role, Sex} from "./Enum";
import {requiredInt, requiredString} from "../types";
import {Address} from "../generated/prisma-client";


export const Mutation = prismaObjectType({
    name:'Mutation',
    definition(t){
        t.prismaFields(['*']);
        t.field('signup',{
            type: 'AuthPayload',
            args:{
                name: stringArg(),
                idNumber:stringArg(),
                phoneNumber:stringArg(),
                password:stringArg(),
                role:arg({
                    type:Role,
                    required:true
                }),
            },
            resolve: async (parent,{name,idNumber,phoneNumber,password},ctx)=>{
                const hashedPassword=await hash(password,10);
                const userInDatabase=await ctx.prisma.$exists.user({
                    name:name,
                    idNumber:idNumber,
                    phoneNumber:phoneNumber
                });
                if (!userInDatabase){
                    throw new Error('You are not a resident of this community')
                }
                let user=await ctx.prisma.user({
                    idNumber:idNumber,
                });
                if (user.password){
                    throw new Error('Your account has been registered.')
                }
                user=await ctx.prisma.updateUser({
                    data:{
                        password:hashedPassword
                    },
                    where:{
                        idNumber:idNumber
                    },
                });
                return {
                    //sign:同步地签署给定的荷载到jwt字符串荷载中。
                    token: sign({ userId: user.id }, APP_SECRET),
                    user
                }
            }
        });
        t.field('login',{
            type:'AuthPayload',
            args:{
                idNumber:stringArg(),
                password:stringArg()
            },
            resolve:async (parent,{idNumber,password},context)=>{
                const user=await context.prisma.user({idNumber});
                if (!user){
                    throw new Error(`No user found for idNumber: ${idNumber}`)
                }
                const passwordValid=await compare(password,user.password);
                if (!passwordValid) {
                    throw new Error('Invalid password')
                }
                return {
                    token: sign({ userId: user.id }, APP_SECRET),
                    user
                }
            }
        });
        t.field('createResident',{
            type:'User',
            args:{
                name:requiredString({}),
                idNumber:requiredString({}),
                phoneNumber:requiredString({}),
                sex:arg({
                    type:Sex,
                    required:true
                }),
                building:requiredInt({}),
                unit:requiredInt({}),
                room:requiredInt({})
            },
            resolve:async (parent,{name,idNumber,phoneNumber,sex,building,unit,room},context)=>{
                const addressInDatabase=await context.prisma.$exists.address({
                    building,
                    unit,
                    room,
                });
                let user;
                if (addressInDatabase){
                    const addresses=await context.prisma.addresses({
                        where:{
                            building,
                            unit,
                            room,
                        }
                    });
                    const address=addresses[0];
                    user=await context.prisma.createUser({
                        name,
                        idNumber,
                        phoneNumber,
                        sex,
                        role:'RESIDENT',
                        address:{
                            connect:{
                                id:address.id
                            }
                        }
                    })
                } else {
                    user=await context.prisma.createUser({
                        name,
                        idNumber,
                        phoneNumber,
                        sex,
                        role:'RESIDENT',
                        address:{
                            create:{
                                building,
                                unit,
                                room
                            }
                        }
                    })
                }
                return user
            },
        });
        t.field('updateResident',{
            type:'User',
            args:{
                id:idArg({required:true}),
                name:stringArg(),
                idNumber:stringArg(),
                phoneNumber:stringArg(),
                sex:arg({type:Sex}),
                building:intArg(),
                unit:intArg(),
                room:intArg()
            },
            resolve:async (parent,{id,name,idNumber,phoneNumber,sex,building,unit,room},context)=>{
                const userOldAddress:Address=await context.prisma.user({id}).address();
                let user=await context.prisma.updateUser({
                    where:{id},
                    data:{
                        idNumber,
                        name,
                        phoneNumber,
                        sex,
                    },
                });
                if (userOldAddress.building!==building||userOldAddress.unit!==unit||
                    userOldAddress.room!==room){
                    const isNewAddressExist=await context.prisma.$exists.address({
                        building,
                        unit,
                        room
                    });
                    if (isNewAddressExist) {
                        const addressNew:Address=(await context.prisma.addresses({
                            where:{
                                building,
                                unit,
                                room
                            }
                        }))[0];
                        user=await context.prisma.updateUser({
                            where:{id},
                            data:{
                                address:{
                                    connect:{
                                        id:addressNew.id
                                    }
                                }
                            }
                        })
                    }else {
                        user=await context.prisma.updateUser({
                            where:{id},
                            data:{
                                address:{
                                    create:{
                                        building,
                                        unit,
                                        room
                                    }
                                }
                            }
                        })
                    }
                }
                return user
            }
        })
    }
});
