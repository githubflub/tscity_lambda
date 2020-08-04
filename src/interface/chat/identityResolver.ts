import { connectToDatabase } from 'lib/database/connectToDatabase'
import { getEntity } from 'lib/database/logic/getEntity'
import { User } from 'lib/schema/user/typedef'
import { getExistingChatConnection } from 'lib/chat/helpers/getExistingChatConnection'


export async function identityResolver(event) {
   let identity;
   await connectToDatabase();
   const chat_connection = await getExistingChatConnection(event, 'identityResolver');

   // sls offline doesn't support auth for websockets,
   // so I'm faking it.
   if (process.env.IS_OFFLINE
      && chat_connection
      && chat_connection.user_id
   ) {

      const find_one_query = {
         id: chat_connection.user_id,
      }

      const user = await getEntity<User>('User', find_one_query)
      if (user) {
         identity = user;
         identity['cognito:username'] = user.username;
         event.requestContext.authorizer = {
            ...event.requestContext.authorizer,
            ...identity,
         }
      }
   }
}