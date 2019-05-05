import { prisma } from './generated/prisma-client'
import datamodelInfo from './generated/nexus-prisma'
import * as path from 'path'
import { makePrismaSchema } from 'nexus-prisma'
import { GraphQLServer } from 'graphql-yoga'
import * as allTypes from './resolvers'
import {permissions} from "./permissions";
/*const Query=prismaObjectType({
    name:'Query',
    definition(t){
        t.prismaFields(['users'])
        t.list.field('allUsersByRole',{
            type:'User',
            args:{
                role:arg({
                    type:Role,
                    required:true
                }),
            },
            resolve:(_,{role},ctx)=>ctx.prisma.users({where:{role:role}})
        })

    }
})*/
const schema = makePrismaSchema({
    // Provide all the GraphQL types we've implemented
    types: allTypes,
    // Configure the interface to Prisma
    prisma: {
      datamodelInfo,
      client: prisma
    },
    // Specify where Nexus should put the generated files
    outputs: {
        //Node.js 中，__dirname 总是指向被执行 js 文件的绝对路径
        //join:连接所有参数并且标准化结果路径，参数必须是字符串
        schema: path.join(__dirname, './generated/schema.graphql'),
        typegen: path.join(__dirname, './generated/nexus.ts'),
    },
    // Configure nullability of input arguments: All arguments are non-nullable by default
    nonNullDefaults:{
        input:false,
        output:false
    },
    // Configure automatic type resolution for the TS representations of the associated types
    typegenAutoConfig:{
        //用于匹配type的文件的数组
        sources:[
            {
                //source: 寻找类型的模块
                // 这里通过require.resolve使用了node resolution算法，
                // 所以，如果它存在与node_modules中，你可以只提供模块名
                // 否则你一个提供文件的绝对路径
                source: path.join(__dirname,'./types.ts'),
                // 当我们导入模块时，我们使用'import * as ____'来防止冲突。
                // 此别名应该是一个不与任何其他类型冲突的名称，通常是一个简短的小写名称。
                alias: 'types'
            }
        ],
        //键入上下文，引用在sources中提供的别名模块中定义的类型，例如'alias.Context'
        contextType:'types.Context',
    },
  });

const server = new GraphQLServer({
    schema,
    middlewares:[permissions],
    context: request => {
        return {
            ...request,
            prisma,
        }
    }
});

server.start(() => console.log('Server is running on http://localhost:4000'));