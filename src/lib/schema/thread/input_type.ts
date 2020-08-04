import { InputType, Field } from "type-graphql";
import { Thread } from './typedef'
import { UserRoleType } from 'lib/schema/user/roles'
import { PostModeType } from './post_modes'

// Here is probably where I can stop users from
// updating fields that they shouldn't. We'll have
// to see later.

@InputType()
export class ThreadInput implements Partial<Thread> {
   @Field(type => String, { nullable: false })
   display_name?: string;

   @Field(type => String, { nullable: false })
   description?: string;

   @Field(type => [String], { nullable: false })
   access_groups?: UserRoleType[];

   @Field(type => [Number], { nullable: false })
   access_users?: number[];

   @Field(type => Boolean, { nullable: false })
   room?: boolean;

   @Field(type => Boolean, { nullable: false })
   primary_room?: boolean;

   @Field(type => Boolean, { nullable: false })
   startup_room?: boolean;

   @Field(type => Boolean, { nullable: false })
   enabled?: boolean;

   @Field(type => [String], { nullable: false })
   post_mode?: PostModeType[];
}