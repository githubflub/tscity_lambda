import { InputType, Field, Int } from "type-graphql";
import { ThreadRead } from "./typedef";

@InputType()
export class ThreadReadInput implements Partial<ThreadRead> {
   @Field(type => Int, { nullable: false })
   thread_id: number;

   @Field(type => Int, { nullable: false })
   user_id: number;
}