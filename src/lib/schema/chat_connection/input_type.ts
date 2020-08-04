import { InputType, Field, ID } from "type-graphql";
import { ChatConnection } from './typedef'

@InputType()
export class ChatConnectionInput implements Partial<ChatConnection>{
   @Field()
   connection_id: string;

   @Field({ nullable: true })
   user_id?: number;

   @Field(type => ID, { nullable: true })
   subscribed_threads?: number[];
}