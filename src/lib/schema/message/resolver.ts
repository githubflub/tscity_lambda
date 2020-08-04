import { Resolver, Mutation, Ctx, Arg, Int, ObjectType, Field } from 'type-graphql'
import { Message } from 'lib/schema/message/typedef'
import { ResolverAuthGuard } from 'lib/auth/typegraphql_decorators/ResolverAuthGuard'
import { sendDM } from './logic/sendDM'
import { Thread } from '../thread/typedef';

@ObjectType()
export class SendDMReturnType {
   @Field(type => Thread)
   thread: Thread;

   @Field(type => Message)
   message: Message;
}

@Resolver(of => Message)
export class MessageResolver {
   @ResolverAuthGuard()
   @Mutation(return_type => SendDMReturnType)
   async sendDM(
      @Ctx() context,
      @Arg('target_user_id', type => Int, { nullable: false }) target_user_id: number,
      @Arg('content', { nullable: false }) content: string,
   ) {
      console.log("MessageResolver.sendDM activated!")

      const identity = context.requester_identity;
      const result = await sendDM(identity, target_user_id, content)

      console.log("sendDM result", result);

      return result;
   }
}