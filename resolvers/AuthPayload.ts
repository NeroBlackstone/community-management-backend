import { objectType } from "nexus";

//objectType()用于生成普通的Object Type
export const AuthPayload = objectType({
    //type的名字
    name: 'AuthPayload',
    //type AuthPayload内部的具体定义
    definition(t) {
        //生成一个String类型，名为token的字段
        t.string('token');
        //生成一个User类型，名为user的字段
        t.field('user',{type:'User'});
    },
});

//在schema内生成如下类型定义
//type AuthPayload {
//   token: String
//   user: User
// }