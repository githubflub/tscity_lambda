import { Message } from 'lib/schema/message/typedef'
import { FindManyOptions, getConnection } from 'typeorm';

export const SHORT_MESSAGE_HISTORY_LENGTH = 10;

export async function listShortMessageHistory(thread_id, requester_user_id) {
   const messages = await getConnection()
      .getRepository(Message)
      .createQueryBuilder("msg")
      .leftJoinAndSelect("msg.threads", "thread")
      .leftJoinAndSelect("msg.targets", "target")
      .leftJoinAndSelect("msg.sender_groups", "sender_group")
      .where(`(
         ( msg.thread_list_interpretation = "whitelist" AND thread.id = :thread_id AND msg.type = "private"
            AND
            ( msg.sender_id = :requester_user_id OR target.user_id = :requester_user_id OR target.thread_id = :thread_id)
         )
         OR
         ( msg.thread_list_interpretation = "whitelist" AND thread.id = :thread_id AND (msg.type <> "private" OR msg.type IS NULL) )
         OR
         ( msg.thread_list_interpretation = "blacklist" AND thread.id <> :thread_id AND (msg.type <> "private" OR msg.type IS NULL))
         OR
         ( msg.thread_list_interpretation = "blacklist" AND thread.id <> :thread_id AND msg.type = "private"
            AND
            ( msg.sender_id = :requester_user_id OR target.user_id = :requester_user_id OR target.thread_id = :thread_id)
         )
      )`, { thread_id, requester_user_id })
      .take(SHORT_MESSAGE_HISTORY_LENGTH)
      .orderBy("msg.send_time", "DESC")
      .getMany()

   messages.reverse();

   console.log("YOUR MESSAGES", messages);
   console.log(messages.length, "results")

   return messages;
}

export async function listMessages(query?: FindManyOptions<Message>) {
   const messages = await Message.find(query);

   // Sigh, add display_name and groups?
   // for (let i = messages.length - 1; i >= 0; i--) {
   //    messages[i].sender.display_name = messages[i].sender.display_name || ''
   //    messages[i].sender.groups = messages[i].sender.groups || []
   // }

   console.log("YOUR MESSAGES", messages);
   return messages;
}