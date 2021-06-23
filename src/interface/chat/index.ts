import { connectClientToChat } from 'lib/chat/connect'
import { disconnectClientFromChat } from 'lib/chat/disconnect'
import { processDefaultAction } from 'lib/chat/default'
import { ApiGatewayManagementApi } from 'lib/chat/ApiGatewayManagementApi'
import { slsOfflineFakeWsAuthorizer } from './slsOfflineFakeWsAuthorizer'
import { identityResolver } from './identityResolver'

export async function handler(event, context) {
   // Nice logs
   let message = `UNKNOWN EVENT WTF`
   let processEvent = (event) => { console.log('processEvent: Unknown event, not doing anything.') };
   switch (event.requestContext.eventType) {
      case 'CONNECT':
         message = `CONNECT EVENT`
         processEvent = connectClientToChat
         // serverless-offline doesn't support authorizers for ws
         // so I fake it here. Handles CONNECT eventTypes
         if (process.env.IS_OFFLINE) {
            await slsOfflineFakeWsAuthorizer(event);
         }
         break
      case 'DISCONNECT':
         message = `DISCONNECT EVENT`
         processEvent = disconnectClientFromChat
         break
      case 'MESSAGE':
         message = `MESSAGE EVENT`
         processEvent = processDefaultAction
         break
   }


   // Parse identity from custom authorizer result.
   console.log('WS EVENT BEFORE FIXING IDENTITY')
   console.log(JSON.stringify(event))
   if (event.requestContext.authorizer && event.requestContext.authorizer.identity) {
      const identity = JSON.parse(Buffer.from(event.requestContext.authorizer.identity, 'base64').toString())
      delete event.requestContext.authorizer.identity

      event.requestContext.authorizer = {
         ...event.requestContext.authorizer,
         ...identity
      }
   }

   // serverless-offline fake websocket auth for
   // non-CONNECT eventTypes.
   if (process.env.IS_OFFLINE && ['DISCONNECT', 'MESSAGE'].includes(event.requestContext.eventType)) {
      await identityResolver(event)
   }

   console.log(message);
   console.log("WS EVENT AFTER FIXING IDENTITY")
   console.log(JSON.stringify(event))

   let response = {
      statusCode: 418,
      body: "There was an error processing your event..."
   }

   try {
      ApiGatewayManagementApi.create(event);
      const result = await processEvent(event);
      console.log("RESULT: ", result)

      response = {
         statusCode: 200,
         body: "Your event has been processed."
      }

      return response
   }
   catch (error) {
      console.log("ERROR:", error)
      response = {
         statusCode: 418,
         body: "There was an error processing your event..."
      }
   }

   return response;
}