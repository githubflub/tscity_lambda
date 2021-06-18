import { connectToDatabase } from 'lib/database/connectToDatabase'
import { ChatConnection } from "lib/schema/chat_connection/typedef";
import { ApiGatewayManagementApi } from 'lib/chat/ApiGatewayManagementApi'
import { getExistingChatConnection } from 'lib/chat/helpers/getExistingChatConnection'
import { listChatUsers } from "lib/schema/user/logic/listChatUsers";
import { listShortMessageHistory } from 'lib/schema/message/logic/list'
import { Thread } from 'lib/schema/thread/typedef';


export async function joinRooms(event, body) {
   console.log("joinrooms ws event")
   const thread_ids = body.payload.thread_ids;
   let result: any = 'ERROR: joinRooms'

   // TODO: A much better job of validating
   // thread_ids payload.

   if (thread_ids && Array.isArray(thread_ids)) {
      const connection_id = event.requestContext.connectionId;
      // identity will be undefined if requester is not logged in.
      const identity = event.requestContext.authorizer
      console.log("identity", identity);
      await connectToDatabase();

      const existing_chat_connection = await getExistingChatConnection(event, 'joinRooms');

      let subscribed_thread_ids = (existing_chat_connection?.subscribed_thread_ids || []).map(item => item);

      for (let i = 0; i < thread_ids.length; i++) {
         subscribed_thread_ids.push(+thread_ids[i]);
      }

      // Dedupe
      subscribed_thread_ids = [ ...new Set(subscribed_thread_ids) ]

      const subscribed_threads = subscribed_thread_ids
         .map(subscribed_thread_id => {
            return new Thread({ id: subscribed_thread_id })
         })

      existing_chat_connection.subscribed_threads = subscribed_threads;
      const updated_chat_connection = new ChatConnection(existing_chat_connection);

      console.log("Updating this chat_connection", updated_chat_connection);
      result = await updated_chat_connection.save();
      console.log("Your updated chat_connection", result)

      // Need to get room data such as which users are online
      // and what the 10 previous messages were.
      // NOTE: Please always do this part after updating the connection.
      // It makes handling users_online easier on the UI.
      const room_data = {}
      for (let i = thread_ids.length - 1; i >= 0; i--) {
         const thread_id = thread_ids[i]
         const [users_online, messages] = await Promise.all( [listChatUsers(thread_id), listShortMessageHistory(thread_id, identity?.id)] );

         const room = {
            id: thread_id,
            users_online,
            messages,
         }

         room_data[thread_id] = room
      }

      // Send response to client(s)
      const ws_message = {
         ...body,
         payload: {
            ...body.payload,
            room_data,
         }
      }

      // Post to origin connection.
      ws_message.payload.origin_connection = true
      await ApiGatewayManagementApi.postToConnection({ ConnectionId: connection_id, Data: JSON.stringify(ws_message) })
      delete ws_message.payload.origin_connection;

      const onOriginConnection = (other_connection_id) => {
         if (other_connection_id === connection_id) {
            console.log("joinRooms Found origin connection. Blocking message...")
            return false;
         }
         else {
            console.log("joinRooms Not origin connection. Allowing message.")
            return true;
         }
      }

      // A new username must appear in all clients' members list.
      // Therefore we must post to all connections.
      console.log("Posting to all clients");
      await ApiGatewayManagementApi.postToAllConnections(ws_message, onOriginConnection);
   }
   else {
      result = 'joinRooms WARNING: Payload validation failed.'
   }


   return "SUCCEEDED: joinRooms";
}