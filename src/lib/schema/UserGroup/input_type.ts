import { Field, InputType, Int } from "type-graphql";
import { UserGroup } from './typedef'

@InputType()
export class UserGroupCreateInput implements Partial<UserGroup> {
   @Field({ nullable: false })
   context: string;

   @Field({ nullable: false })
   context_id: number;

   @Field({ nullable: false })
   user_id: number;

   @Field({ nullable: false })
   group: string;
}

@InputType()
export class UserGroupRemoveInput implements Partial<UserGroup> {
   @Field(type => Int, { nullable: false })
   id: number;
}