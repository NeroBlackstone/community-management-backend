import {Query} from "./Query";
import {Mutation} from "./Mutation";
import {AuthPayload} from "./AuthPayload";
import {Sex,Status,Role} from "./Enum"
import {Subscription} from './Subscription'
import {asNexusMethod} from "nexus";
import {GraphQLUpload} from 'graphql-upload'

//Nexus allows you to provide an asNexusMethod property which will make the scalar available as a builtin on the
// definition block object.
export const Upload=asNexusMethod(GraphQLUpload,'upload');

export const resolvers={
    Query,
    Mutation,
    AuthPayload,
    Sex,
    Status,
    Role,
    Subscription
};