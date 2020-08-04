import { ChatConnection } from 'lib/schema/chat_connection/typedef';
import { ChatConnectionInput } from '../input_type';

export async function deleteChatConnection(chat_connection_data) {

   console.log("Deleting a chat connection with this data:")
   console.log(chat_connection_data)

   const existing_chat_connection = await ChatConnection.findOne({ connection_id: chat_connection_data.connection_id })
   console.log("Existing ChatConnection", existing_chat_connection)

   const chat_connection_to_remove = new ChatConnection(existing_chat_connection)
   const removed_chat_connection = await chat_connection_to_remove.remove();

   console.log("Deleted this ChatConnection!\n", JSON.stringify(removed_chat_connection))

   return removed_chat_connection
}