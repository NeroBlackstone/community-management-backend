import {verify} from 'jsonwebtoken';
import {Context} from "./types";

//app key
export const APP_SECRET='BLACKOPS4';

//Token接口，定义带有string类型的userId字段的对象的形状
interface Token {
    userId:string
}

export function getUserId(context:Context) {
    //取得http请求内的Authorization的字段的值
    const Authorization = context.request.get('Authorization');
    //如果该http请求存在Authorization
    if (Authorization){
        //移除Authorization字段内jwt的'Bearer '前缀
        const token=Authorization.replace('Bearer ','');
        //Verify：使用私钥和公钥异步验证所给的token，取得解密的token
        const verifiedToken=verify(token,APP_SECRET) as Token;
        return verifiedToken && verifiedToken.userId;
    }
}