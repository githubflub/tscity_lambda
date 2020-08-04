import { connectToDatabase } from "lib/database/connectToDatabase";
import { listChatConnections } from 'lib/schema/chat_connection/logic/list'
import { ApiGatewayManagementApi } from 'lib/chat/ApiGatewayManagementApi'
import { isAuthenticated } from 'lib/chat/helpers/isAuthenticated'
import { isSilenced } from 'lib/chat/helpers/isSilenced'
import { createMessage } from 'lib/schema/message/logic/create'
import { listMessages } from 'lib/schema/message/logic/list'
import { Message } from 'lib/schema/message/typedef'
import { FindManyOptions } from 'typeorm';
import { createEntity } from 'lib/database/logic/create'
import { ThreadSilence } from "lib/schema/ThreadSilence/typedef";


export async function sendMessage(event, body) {
   // Don't waste time if user is unauthenticated.
   if (!isAuthenticated(event)) {
      return "sendMessage access denied: user not authenticated!";
   }

   const identity = event.requestContext.authorizer;

   await connectToDatabase();

   // Make sure that user is not silenced.
   const is_silenced = await isSilenced(identity, body)
   if (!!is_silenced) {
      return "sendMessage access denied: user is silenced!";
   }

   // TODO
   // Make sure they have permission to write to specified thread

   const message_data = {
      ...body.payload,
      sender: {
         id: identity['id'],
         username: identity['cognito:username'],
         display_name: identity['display_name'],
         groups: identity['groups'] // This needs to be thread specific
      }
   }
   const new_message = await createMessage(message_data);
   console.log('Your new message:', JSON.stringify(new_message, null, 2));

   const post_data = {
      ...body,
      payload: new_message
   };

   // Get array of connections?
   const result = await ApiGatewayManagementApi.postToAllConnections(post_data);

   // Do flooding check here.
   const ALLOWED_MESSAGES = 3;
   const TIME = 8000; // ms
   const MUTE_DURATION = 60000;

   const messages_request: FindManyOptions<Message> = {
      take: ALLOWED_MESSAGES,
      order: {
         send_time: 'DESC'
      },
      where: {
         thread_id: new_message.thread_id
      }
   }

   try {
      const third_previous_message = (await listMessages(messages_request))[ALLOWED_MESSAGES - 1]
      console.log('Third previous message:', third_previous_message)
      const send_time = third_previous_message.send_time; // this is an object (presumably Date object)
      // console.log('typeof send_time', typeof send_time, send_time)
      const parsed_send_time = Date.parse(send_time.toISOString()); // this is a number
      console.log('parsed_send_time:', typeof parsed_send_time, parsed_send_time);
      console.log('date now:',  Date.now());


      // third_previous_message will be undefined if user hasn't sent 3 messages!
      if (third_previous_message) {
         // Check timestamp!
         if ((Date.now() - parsed_send_time) < TIME) {
         // if (true) { // used for testing
            console.log('This guy is flooding!!!')
            // Create a ThreadSilence!
            const thread_silence_data = {
               user_id: identity['id'],
               thread_id: message_data.thread_id,
               silenced_by: 'System',
               reason: 'Flooding',
               expires: new Date(MUTE_DURATION + Date.now())
            }
            await createEntity(ThreadSilence, thread_silence_data);
         }
         else {
            console.log('User is not flooding!');
         }
      }
   }
   catch (error) {
      console.log('ERROR: sendMessage flooding check:', error);
   }


   return result;
}