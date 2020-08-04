import { ObjectType, Field, ID } from 'type-graphql'

@ObjectType()
export class SystemMessage {
   @Field(type => Boolean)
   system_message: true;

   @Field(type => String)
   content: string;
}