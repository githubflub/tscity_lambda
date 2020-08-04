import { InputType, Field } from "type-graphql";
import { User } from './typedef'

@InputType()
export class UserInput implements Partial<User>{
   // This can be null in GraphQL layer.
   // But internally, it's required!
   @Field({ nullable: true })
   username: string;

   // Let's leave this off until it gets annoying.
   // @Field({ nullable: true })
   sub?: string;

   @Field({ nullable: true })
   display_name?: string;

   @Field({ nullable: true })
   full_name?: string;

   @Field({ nullable: true })
   given_name?: string;

   @Field({ nullable: true })
   email?: string;

   @Field({ nullable: true })
   email_verified?: boolean;

   @Field({ nullable: true })
   phone_number?: string;

   @Field({ nullable: true })
   phone_verified?: boolean;
}