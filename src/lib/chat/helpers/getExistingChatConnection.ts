import { getEntity } from 'lib/database/logic/getEntity'
import { ChatConnection } from "lib/schema/chat_connection/typedef";
import { connectToDatabase } from 'lib/database/connectToDatabase'

export async function getExistingChatConnection(event, method_name) {
   const connection_id = event.requestContext.connectionId;
   await connectToDatabase();

   const find_one_query = {
      connection_id,
   }

   console.log(`${method_name} findOne query`)
   console.log(find_one_query);

   const existing_chat_connection = await getEntity<ChatConnection>('ChatConnection', find_one_query)
   return existing_chat_connection;
}