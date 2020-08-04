import { InputType, Field } from "type-graphql";
import { Profile } from './typedef'
import { profile_privacy_options } from '@tscity/shared/profile_visibility'

@InputType()
export class ProfileInput implements Partial<Profile>{
   // @Field({ nullable: false })
   // id: number;

   @Field({ nullable: true })
   user_id?: number;

   @Field({ nullable: true })
   username?: string;

   @Field({ nullable: true })
   about_me?: string;

   @Field(type => String, { nullable: true })
   visibility?: keyof typeof profile_privacy_options;
}