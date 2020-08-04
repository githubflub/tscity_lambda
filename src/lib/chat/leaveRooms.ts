import { connectToDatabase } from 'lib/database/connectToDatabase'
import { ChatConnection } from 'lib/schema/chat_connection/typedef'
import { ApiGatewayManagementApi } from 'lib/chat/ApiGatewayManagementApi'
import { getExistingChatConnection } from 'lib/chat/helpers/getExistingChatConnection'


export async function leaveRooms(event, body) {
   const thread_ids_to_remove = body.payload.thread_ids;
   let result: any = 'ERROR: leaveRooms'

   if (Array.isArray(thread_ids_to_remove) && thread_ids_to_remove.length) {
      const connection_id = event.requestContext.connectionId;
      const identity = event.requestContext.authorizer;
      await connectToDatabase();

      const existing_chat_connection = await getExistingChatConnection(event, 'leaveRooms')

      const new_threads_list = existing_chat_connection.subscribed_threads.filter(thread_id => {
         if (thread_ids_to_remove.includes(thread_id)) {
            return false;
         }

         return true;
      })

      existing_chat_connection.subscribed_threads = new_threads_list;
      const updated_chat_connection = new ChatConnection(existing_chat_connection);

      console.log("Updating this chat_connection", updated_chat_connection);
      result = await updated_chat_connection.save();
      console.log("Your updated chat_connection", result)

      // Send message to all clients...
      // but only if it's the connection of
      // an authenticated user
      if (result.user_id) {
         const ws_message = {
            ...body,
            payload: {
               ...body.payload,
               user: {
                  id: result.user_id,
                  username: identity['cognito:username'],
                  __typename: 'User',
               }
            }
         }

         await ApiGatewayManagementApi.postToAllConnections(ws_message);
      }
   }
   else {
      result = 'SUCCEEDED: leaveRooms'
   }

   return "SUCCEEDED: leaveRooms";
}