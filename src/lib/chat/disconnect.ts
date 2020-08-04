import { connectToDatabase } from 'lib/database/connectToDatabase'
import { deleteChatConnection } from 'lib/schema/chat_connection/logic/delete'
import { listChatConnections } from 'lib/schema/chat_connection/logic/list'
import { ApiGatewayManagementApi } from 'lib/chat/ApiGatewayManagementApi'


export async function disconnectClientFromChat(event) {
   await connectToDatabase();

   const identity = event.requestContext.authorizer;

   const chat_connection_data = {
      connection_id: event.requestContext.connectionId,
   }

   const deleted_chat_connection = await deleteChatConnection(chat_connection_data)

   // Tell everyone that the dude quit if needed
   // The same client may have multiple connections.
   // so don't send a 'QUIT' message unless all
   // their connections have been closed.


   // Get array of connections?
   const client_open_connections = await listChatConnections({ user_id: identity.id });

   if (Array.isArray(client_open_connections) && client_open_connections.length) {
      // Client has other authenticated connections open, so leave this one alone.
   }
   else {
      // Only need to send messages if this
      // was the connection of an authenticated user
      // for now...
      if (deleted_chat_connection.user_id) {
         const ws_message = {
            action: 'quit',
            payload: {
               user: {
                  id: identity.id,
                  username: identity['cognito:username']
               },
               subscribed_threads: deleted_chat_connection.subscribed_threads || []
            }
         }

         await ApiGatewayManagementApi.postToAllConnections(ws_message);
      }
   }

   return deleted_chat_connection
}