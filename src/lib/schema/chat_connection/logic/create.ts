import { ChatConnection } from 'lib/schema/chat_connection/typedef';

export async function createChatConnection(chat_connection_data) {

   console.log("Creating a chat connection with this data:")
   console.log(JSON.stringify(chat_connection_data, null, 2))

   const new_chat_connection = new ChatConnection(chat_connection_data);
   const created_chat_connection = await new_chat_connection.save()

   console.log("Created this ChatConnection!\n", JSON.stringify(created_chat_connection))

   return created_chat_connection
}