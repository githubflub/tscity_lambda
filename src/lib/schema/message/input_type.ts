import { InputType, Field } from "type-graphql";
import { Message } from './typedef'

@InputType()
export class MessageInput implements Partial<Message>{
   @Field(type => String)
   content?: string;
}