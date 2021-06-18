import AWS, { ApiGatewayManagementApi as oops } from 'aws-sdk'
import { listChatConnections } from 'lib/schema/chat_connection/logic/list'
import { deleteChatConnection } from 'lib/schema/chat_connection/logic/delete'
import { ChatConnection } from 'lib/schema/chat_connection/typedef';


let apigwManagementApi = undefined;
const WS_LOCAL_PORT = process.env.WS_LOCAL_PORT

async function postToConnection(body) {
   let result = 'success';

   try {
      await apigwManagementApi.postToConnection(body).promise()
   }
   catch (error) {
      // Prepare delete request if I need it
      const delete_request = { connection_id: body.ConnectionId }
      if (error.statusCode === 410) {
         console.log(`Found stale connection, deleting ${body.ConnectionId}`);
         // Assumes you're connected to database
         await deleteChatConnection(delete_request)
      }
      else if (typeof error.message === 'string' && error.message.includes('Invalid connectionId')) {
         console.log(`Found invalid connection, deleting ${body.ConnectionId}`);
         await deleteChatConnection(delete_request)
      }
      else {
         console.log('ERROR: postToConnection', error);
         result = 'fail'
         // throw error; Commented out cuz I don't want Promise.all to fail.
      }
   }

   return result;
}

export const ApiGatewayManagementApi = {
   create: (event) => {
      if (!apigwManagementApi) {
         let config: oops.Types.ClientConfiguration = {
            apiVersion: '2018-11-29',
         }

         if (process.env.IS_OFFLINE) {
            config = {
               apiVersion: '2029',
               endpoint: `http://localhost:${WS_LOCAL_PORT}`
            }
         }
         else {
            config = {
               apiVersion: '2018-11-29',
               endpoint: event.requestContext.domainName + "/" + event.requestContext.stage
            }
         }

         apigwManagementApi = new AWS.ApiGatewayManagementApi(config);
      }
   },
   postToConnection,
   // Assumes you're already connected to db
   postToAllConnections: async (
      ws_message,
      onOriginConnection?: Function,
      // if provided, posts to these connections.
      connections?: ChatConnection[]
      ) => {
      const chat_connections = (Array.isArray(connections) && connections) || await listChatConnections();
      const post_calls = chat_connections.map(async (chat_connection) => {
         const { connection_id } = chat_connection;
         let proceed = true

         if (onOriginConnection) {
            proceed = onOriginConnection(connection_id, ws_message)
         }

         if (proceed) {
            await postToConnection({ ConnectionId: connection_id, Data: JSON.stringify(ws_message) });
         }
      });

      const result = await Promise.all(post_calls);
      return result;
   }
}