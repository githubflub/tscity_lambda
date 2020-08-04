import { Message } from 'lib/schema/message/typedef';

export async function createMessage(message_data) {

   console.log("Creating a message with this data:")
   console.log(JSON.stringify(message_data, null, 2))

   const new_message = new Message(message_data);
   const created_message = await new_message.save()

   console.log("Created this Message!\n", JSON.stringify(created_message))

   return created_message
}