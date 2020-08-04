import { Message } from 'lib/schema/message/typedef'
import { FindManyOptions } from 'typeorm';

export const SHORT_MESSAGE_HISTORY_LENGTH = 10;

export async function listShortMessageHistory(thread_id) {
   const query: FindManyOptions<Message> = {
      take: SHORT_MESSAGE_HISTORY_LENGTH,
      order: {
         send_time: 'DESC'
      },
      where: {
         thread_id
      }
   }

   return (await listMessages(query)).reverse();
}

export async function listMessages(query?: FindManyOptions<Message>) {
   const messages = await Message.find(query);

   // Sigh, add display_name and groups?
   for (let i = messages.length - 1; i >= 0; i--) {
      messages[i].sender.display_name = messages[i].sender.display_name || ''
      messages[i].sender.groups = messages[i].sender.groups || []
   }

   console.log("YOUR MESSAGES", messages);
   return messages;
}