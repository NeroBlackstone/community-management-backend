import {prismaObjectType} from "nexus-prisma";
import {compare, hash} from 'bcrypt'
import {arg, intArg, stringArg} from "nexus";
import {APP_SECRET} from '../utils'
import {sign} from 'jsonwebtoken'
import {Role, Sex} from "./Enum";
import {requiredId, requiredInt, requiredString} from "../types";
import {Address} from "../generated/prisma-client";
import {Upload} from "./index";
import * as mkdirp from 'mkdirp'
import * as shortid from 'shortid'
import {createWriteStream} from "fs";

const uploadDir = './uploads';

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
                    throw new Error(`身份证号 ${idNumber}没有相应的居民`)
                }
                const passwordValid=await compare(password,user.password);
                if (!passwordValid) {
                    throw new Error('无效的密码')
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
                id:requiredId({}),
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
        });
        t.field('createWorker',{
            type:"User",
            args:{
                name:requiredString({}),
                idNumber:requiredString({}),
                phoneNumber:requiredString({}),
                password:requiredString({})
            },
            resolve:async (parent,{name,idNumber,phoneNumber,password},context)=>{
                const hashedPassword=await hash(password,10);
            return await context.prisma.createUser({
                    name,
                    idNumber,
                    phoneNumber,
                    password: hashedPassword,
                    role: 'WORKER',
                })
            }
        });
        t.field('updateWorker',{
            type:'User',
            args:{
                id:requiredId({}),
                name:requiredString({}),
                idNumber:requiredString({}),
                phoneNumber:requiredString({}),
                password:requiredString({})
            },
            resolve:async (parent,{id,name,idNumber,phoneNumber,password},context)=>{
                if (password==='******'){
                    return await context.prisma.updateUser({
                        where: {id},
                        data: {
                            name,
                            idNumber,
                            phoneNumber,
                        }
                    });
                }
                else{
                    const hashedPassword=await hash(password,10);
                    return await context.prisma.updateUser({
                        where: {id},
                        data: {
                            name,
                            idNumber,
                            phoneNumber,
                            password:hashedPassword
                        }
                    });
                }
            }
        });
        t.field('singleUpload',{
            type:'File',
            args:{file: arg({type:Upload,required:true})},
            resolve:async (parent,{file},context)=>processUpload(file,context)
        })
    }
});

async function processUpload(upload,context){
    mkdirp.sync(uploadDir);
    const {createReadStream, filename, mimetype, encoding}=await upload;
    const stream=createReadStream();
    const {fileId,path}=await storeUpload({stream,filename});
    return recordFile({fileId,filename,mimetype,encoding,path},context)
};

async function storeUpload({stream,filename}):Promise<any>{
    const fileId=shortid.generate();
    const path=`${uploadDir}/${fileId}-${filename}`;
    return new Promise((resolve, reject) =>
        stream
            .pipe(createWriteStream(path))
            .on('finish', () => resolve({ fileId, path }))
            .on('error', reject),
    )
}

const recordFile=async ({fileId,filename,mimetype,encoding,path},context)=>
    await context.prisma.createFile({fileId,filename,mimetype,encoding,path});
