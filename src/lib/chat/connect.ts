import { connectToDatabase } from 'lib/database/connectToDatabase'
import { createChatConnection } from 'lib/schema/chat_connection/logic/create'
import { isAuthenticated } from 'lib/chat/helpers/isAuthenticated'
import { listChatUsers } from 'lib/schema/user/logic/listChatUsers'
import { ApiGatewayManagementApi } from 'lib/chat/ApiGatewayManagementApi'

export async function connectClientToChat(event) {
   await connectToDatabase();

   const chat_connection_data = {
      connection_id: event.requestContext.connectionId,
      user_id: isAuthenticated(event)? event.requestContext.authorizer.id : undefined,
   }

   const new_chat_connection = await createChatConnection(chat_connection_data)

   return new_chat_connection
}