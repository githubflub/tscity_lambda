import { connectToDatabase } from "lib/database/connectToDatabase";
import { listChatConnections } from 'lib/schema/chat_connection/logic/list'
import { ApiGatewayManagementApi } from 'lib/chat/ApiGatewayManagementApi'
import { isAuthenticated } from 'lib/chat/helpers/isAuthenticated'
import { isSilenced } from 'lib/chat/helpers/isSilenced'
import { createMessage } from 'lib/schema/message/logic/create'
import { listMessages } from 'lib/schema/message/logic/list'
import { Message } from 'lib/schema/message/typedef'
import { FindManyOptions, getConnection, In } from 'typeorm';
import { createEntity } from 'lib/database/logic/create'
import { ThreadSilence } from "lib/schema/ThreadSilence/typedef";
import { getEntity } from "lib/database/logic/getEntity"
import { Thread } from "lib/schema/thread/typedef";
import { User } from "lib/schema/user/typedef";
import { MessageTarget } from "lib/schema/MessageTarget/typedef";
import { MessageSenderGroup } from "lib/schema/MessageSenderGroup/typedef";
import { ChatConnection } from "lib/schema/chat_connection/typedef";


export async function sendMessage(event, body) {
   // Don't waste time if user is unauthenticated.
   if (!isAuthenticated(event)) {
      return "sendMessage access denied: user not authenticated!";
   }

   // Don't waste time if message content is not a string
   if (typeof body?.payload?.content !== 'string') {
      return "sendMessage access denied: message content must be a string!";
   }

   const identity = event.requestContext.authorizer;

   await connectToDatabase();

   let origin_thread;
   // I require every sendMessage request to send an
   // "origin" thread, which means a thread from which
   // a message was sent from. I will also validate
   // whether that origin thread exists. If not, I will
   // return an error object.
   const origin_thread_id = body?.payload?.origin_thread_id
   if (origin_thread_id) {
      const get_origin_thread_request = {
         where: {
            id: origin_thread_id,
            // Only let users post messages to enabled threads.
            // From the users's perspective, disabled threads
            // don't exist, so of course you can't post to them.
            enabled: true,
         }
      }

      origin_thread = await getEntity<Thread>("Thread", get_origin_thread_request)
   }
   else {
      // No origin thread provided. Return error object.
      return "sendMessage access denied: no origin thread_id provided"
   }

   if (!origin_thread) {
      // User did not provide a thread_id to a thread
      // that we could find, so return an error object.
      return "sendMessage access denied: invalid origin thread_id"
   }


   // Make sure that user is not silenced.
   const is_silenced = await isSilenced(identity, body)
   if (!!is_silenced) {
      return "sendMessage access denied: user is silenced!";
   }

   // TODO
   // Make sure they have permission to write to specified thread.
   // This is necessary to prevent bad actors from using Postman to,
   // for example, try to write a message in a random person's DMs
   // by guessing thread_ids.
   const message_data = {
      ...body.payload,
      threads: [origin_thread],
      targets: [],
      sender_id: identity.id,
      sender_username: identity['cognito:username'],
      sender_display_name: identity.display_name,
      // sender_groups will be added further down in this file.
      sender: {
         id: identity['id'],
         username: identity['cognito:username'],
         display_name: identity['display_name'],
         groups: identity['groups'] // This needs to be thread specific
      }
   }

   // Check for slash commands in message.
   message_data.content = message_data.content.trim();
   const COMMAND_REGEX = /^\/[\S]+/;
   const match_result = message_data.content.match(COMMAND_REGEX)?.shift();
   switch (match_result) {
      case "/me": {
         message_data.content = message_data.content.replace(/^\/me/, "").trim();
         message_data.type = "me";
         break
      }
      case "/private": {
         message_data.type = "private"
         const command_args = message_data.content.split(" ");
         // index 0 contains /private
         // index 1 contains target
         // indexes 2 and beyond contain the message.

         // parse the message
         const message = command_args.slice(2).join(" ").trim();
         if (!message) {
            // if there's no message, return an error object (not a chat message)
            // to the sender. The UI should then take that error object and
            // display the appropriate UX to the user.
            return "sendMessage access denied: a message is required!";
         }
         else {
            message_data.content = message;
         }

         // parse the target.
         // target can be either a room or a specific chatter.
         // room targets are prefixed with "#". for example: "#cafe".
         // chatter targets have no prefix.
         const target = command_args[1];
         const prefix = target.charAt(0);
         if (prefix === '#') {
            // user wants to send this private message to a room.
            // we need to get which room and then check if such a room
            // exists? if the room doesn't exist, do nothing.
            const target_room_name = target.substring(1);

            // search for a room with the given name.
            // room names are unique (and case insensitive based on current db collation),
            // so there should be only 0 or 1 result.
            const find_room_query = {
               where: {
                  internal_name: target_room_name,
                  is_dm: false,
                  room: true,
               }
            }

            const target_room = await getEntity<Thread>('Thread', find_room_query)

            if (!target_room) {
               // return an error object to the sender
               // because the room they wanted
               // to post to was not found.
               return "sendMessage access denied: target room not found!";
            }
            else {
               // target room exists and has been found!

               // target room should be added to message's threads
               // if necessary.
               if (target_room.id !== origin_thread.id) {
                  message_data.threads.push(target_room);
               }

               const message_target_data = {
                  target_type: "thread" as const,
                  thread_id: target_room.id,
                  thread_internal_name: target_room.internal_name,
                  thread_display_name: target_room.display_name,
               }

               const message_target = new MessageTarget(message_target_data);
               await message_target.save();

               message_data.targets.push(message_target);
            }

         }
         else {
            // send message to a regular user.
            // clients send target usernames instead of IDs,
            // so i will have to turn these usernames into IDs.
            // Then I will return all the active connections
            // with matching user_ids.

            // Search for the users.
            const get_user_request = {
               where: {
                  username: target
               }
            }
            const target_user = await getEntity<User>("User", get_user_request);

            if (!target_user) {
               // user was not found. Return an error object to
               // client
               return "sendMessage access denied: target user not found!";
            }
            else {
               // user was found
               const message_target_data = {
                  target_type: "user" as const,
                  user_id: target_user.id,
                  username: target_user.username,
                  user_display_name: target_user.display_name,
               }

               const message_target = new MessageTarget(message_target_data)
               await message_target.save();
               message_data.targets.push(message_target)
            }
         }

         // end of case "private"
         break
      }
   }

   let sender_groups = [];
   for (let i = 0; i < (identity.groups || []).length; i++) {
      const group = identity.groups?.[i]
      if (group) {
         const sender_group = new MessageSenderGroup({
            context: group.context,
            context_id: group.context_id,
            group: group.group,
            user_id: group.user_id
         })

         await sender_group.save()
         sender_groups.push(sender_group)
      }
   }
   message_data.sender_groups = sender_groups
   const new_message = await createMessage(message_data);
   console.log('Your new message:', JSON.stringify(new_message, null, 2));

   const post_data = {
      ...body,
      payload: new_message
   };

   // Send the message to clients.
   // Some messages should be sent to all clients.
   // Others shouldn't. Take care of this.
   let result;
   if (new_message.type === "private") {
      // if #same, post to all connections subscribed to #same
      // if #other, post to all connections subscribed to #other and sender connection explicitly if they're not subscribed to #other.
      // if self, post to self connection.
      // if other, post to other and sender connections.

      // if combination, look for #room targets, get connections from those rooms.
      // if sender is not amongst those connections, explicitly post to sender as well.
      // for each non-sender target that is not in connections, explicitly send to them as well.

      // we need to get separate lists of room/user targets.
      // this is so we can query for relevant connections.
      const room_target_ids = []
      const user_target_ids = [identity.id]
      message_data.targets
         .forEach(target => {
            switch (target.target_type) {
               case "user": {
                  user_target_ids.push(target.user_id)
                  break
               }
               case "thread": {
                  room_target_ids.push(target.thread_id)
                  break
               }
            }
         })

      // now we can write query for connections.
      // build query here with queryBuilder.
      // then pass it to the function, and
      // the function will run it instead if it exists.

      const some_connections = await getConnection()
         .getRepository(ChatConnection)
         .createQueryBuilder("chat_connection")
         .leftJoinAndSelect("chat_connection.subscribed_threads", "subscribed_thread")
         .where(`(
            ${room_target_ids.length? "( subscribed_thread.id IN (:room_target_ids) )" : ""}
            ${(room_target_ids.length && user_target_ids.length)? "OR" : ""}
            ${user_target_ids.length? "( chat_connection.user_id IN (:user_target_ids) )" : ""}
         )`, { room_target_ids, user_target_ids })
         .getMany()

      result = await ApiGatewayManagementApi.postToAllConnections(post_data, undefined, some_connections)
   }
   else {
      result = await ApiGatewayManagementApi.postToAllConnections(post_data);
   }

   // Do flooding check here.
   const ALLOWED_MESSAGES = 3;
   const TIME = 8000; // ms
   const MUTE_DURATION = 60000;

   // No relations are required to be loaded for this request.
   const messages_request: FindManyOptions<Message> = {
      take: ALLOWED_MESSAGES,
      order: {
         send_time: 'DESC'
      },
      where: {
         sender_id: identity.id,
         origin_thread_id: new_message.origin_thread_id
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
               user_id: identity.id,
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