import {enumType} from "nexus";

export const Role = enumType({
    name: "Role",
    members: ['RESIDENT','WORKER','MANAGER'],
});
export const Sex = enumType({
    name: "Sex",
    members: ['MALE','FEMALE'],
});
export const Status = enumType({
    name: "Status",
    members: ['PENDING','APPROVED','REJECTED'],
});