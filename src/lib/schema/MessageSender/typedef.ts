import { Field, Int, ObjectType } from "type-graphql";
import { UserGroup } from "../UserGroup/typedef";

@ObjectType()
export class MessageSenderType {
   @Field(type => Int)
   id: string

   @Field(type => String)
   username: string

   @Field(type => String)
   display_name: string;

   @Field(type => [UserGroup])
   groups: UserGroup[]
}