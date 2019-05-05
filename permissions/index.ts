import { rule, shield } from 'graphql-shield'
import { getUserId } from '../utils'

const rules={
    isAuthenticatedUser:rule()(
        (parent,args,context)=>{
            const userId = getUserId(context);
            return Boolean(userId);
        }),
};
//验证规则并且从定义的规则树内产生
export const permissions=shield({
    Query:{
        me:rules.isAuthenticatedUser,
    }
});