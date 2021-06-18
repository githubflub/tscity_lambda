import { Resolver, Mutation, Ctx, Arg, Int, ObjectType, Field, Query } from 'type-graphql'
import { Message } from 'lib/schema/message/typedef'
import { ResolverAuthGuard } from 'lib/auth/typegraphql_decorators/ResolverAuthGuard'
import { sendDM } from './logic/sendDM'
import { Thread } from '../thread/typedef';
// import { MessageTarget } from '../MessageTarget/typedef';
import { getEntity } from 'lib/database/logic/getEntity';
import { listMessages, listShortMessageHistory } from 'lib/schema/message/logic/list'
import { getConnection } from 'typeorm';
import { MessageSenderGroup } from '../MessageSenderGroup/typedef';

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

   // @Query(return_type => String)
   // async writeMessage() {
   //    const message_data = {
   //       id: 300,
   //       sender: {"id":"23","username":"cuadxyz3","display_name":"","groups":[]},
   //       thread_id: "1",
   //       content: "this is a test message",
   //       type: "private" as const
   //    }

   //    const message = new Message(message_data);
   //    // await message.save();

   //    // const message_target_1_data = { message, target_type: "user" as const, user_id: 8, username: "cuadicles" }
   //    // const message_target_1 = new MessageTarget(message_target_1_data)
   //    // await message_target_1.save();

   //    return "Hello from MessageResolver!!";
   // }

   // @Query(return_type => String)
   // async getMessage() {
   //    const result = await getEntity("Message", {
   //       where: {
   //          id: 300
   //       },
   //       relations: ["targets"]
   //    })

   //    return "Hello from MessageResolver!!";
   // }

   // @Query(return_type => String)
   // async migrateMessages() {
   //    const connection = await getConnection()
   //    const msgRepo = connection.getRepository(Message);

   //    const messages = await listMessages({
   //       relations: ["targets", "threads", "sender_groups"]
   //    });

   //    for (let i = 0; i < messages.length; i++) {
   //       const msg = messages[i];

   //       // update sender
   //       // msg.sender_id = +msg.sender.id
   //       // msg.sender_username = msg.sender.username
   //       // if (msg.sender.display_name) {
   //       //    msg.sender_display_name = msg.sender.display_name
   //       // }

   //       // const groups = msg.sender.groups || []
   //       // const sender_groups = [];
   //       // for (let j = 0; j < groups.length; j++) {
   //       //    const group = groups[j];
   //       //    const sender_group = new MessageSenderGroup({
   //       //       context: group.context,
   //       //       context_id: group.context_id,
   //       //       group: group.group,
   //       //       user_id: group.user_id
   //       //    });

   //       //    await sender_group.save()
   //       //    sender_groups.push(sender_group);
   //       // }

   //       // if (sender_groups.length) {
   //       //    msg.sender_groups = sender_groups
   //       // }

   //       // // origin thread_ids
   //       // msg.origin_thread_id = +msg.thread_id;

   //       // threads
   //       if (!msg.threads.length) {
   //          const message_thread = new Thread({
   //             id: +msg.thread_id
   //          })

   //          msg.threads = [message_thread]
   //          await msgRepo.save(msg)
   //       }

   //    }

   //    return "Hello from migrateMessages!!"
   // }

   // @Query(return_type => [Message])
   // async getMessages() {
   //    const result = await listShortMessageHistory(1, 24)

   //    return result;
   // }

   // @Query(return_type => String)
   // async listMessages() {
   //    const messages = await listMessages({
   //       relations: ["targets", "threads", "sender_groups"]
   //    });

   //    return "hello from MessageResolver";
   // }
}