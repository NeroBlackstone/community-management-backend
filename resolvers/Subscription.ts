import {subscriptionField} from "nexus";
import {requiredId} from "../types";

export const Subscription=subscriptionField('comment',{
    type: 'CommentSubscriptionPayload',
    args:{
        adviceId:requiredId({}),
    },
    subscribe(root,{adviceId},ctx){
        return ctx.prisma.$subscribe.comment({mutation_in:['CREATED'],node:{advice:{id:adviceId}}})
    },
    resolve(payload){
        return payload
    }
});
