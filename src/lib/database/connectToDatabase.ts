import 'reflect-metadata'
import 'mysql'
import { createConnection, ConnectionOptions, getConnection } from 'typeorm'
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { injectConnectionOptions } from './injectConnectionOptions'

// Entities
import { Block } from 'lib/schema/Block/typedef'
import { User } from 'lib/schema/user/typedef'
import { ChatConnection } from 'lib/schema/chat_connection/typedef'
import { ChatSettings } from 'lib/schema/ChatSettings/typedef'
import { FriendRequest } from 'lib/schema/FriendRequest/typedef'
import { Message } from 'lib/schema/message/typedef'
import { MessageTarget } from 'lib/schema/MessageTarget/typedef'
import { MessageSenderGroup } from 'lib/schema/MessageSenderGroup/typedef'
import { Thread } from 'lib/schema/thread/typedef'
import { ThreadRead } from 'lib/schema/ThreadRead/typedef'
import { ThreadSilence } from 'lib/schema/ThreadSilence/typedef'
import { ThreadUserAccess } from 'lib/schema/ThreadUserAccess/typedef'
import { Profile } from 'lib/schema/Profile/typedef'
import { UserGroup } from 'lib/schema/UserGroup/typedef'
import { IpAddress } from 'lib/schema/IpAddress/typedef'

// Subscribers
// import { DatabaseUpdateHook } from 'lib/elasticsearch/DatabaseUpdateHook'

const {
   DB_TYPE,
   DB_HOST,
   DB_PORT,
   DB_USERNAME,
   DB_PASSWORD,
   DB_NAME
} = process.env;

export async function connectToDatabase() {

   // console.log("envars:\n", JSON.stringify({
   //    type: DB_TYPE,
   //    host: DB_HOST,
   //    port: DB_PORT,
   //    username: DB_USERNAME,
   //    password: DB_PASSWORD,
   //    database: DB_NAME,
   // }, null, 2))

   const connection_options: ConnectionOptions = {
      type: DB_TYPE as MysqlConnectionOptions["type"],
      host: DB_HOST,
      port: +DB_PORT,
      username: DB_USERNAME,
      password: DB_PASSWORD,
      database: DB_NAME,
      entities: [
         Block,
         ChatConnection,
         ChatSettings,
         FriendRequest,
         IpAddress,
         Message,
         MessageTarget,
         MessageSenderGroup,
         Profile,
         Thread,
         ThreadRead,
         ThreadSilence,
         ThreadUserAccess,
         User,
         UserGroup,
      ],
      // subscribers: [DatabaseUpdateHook],
      synchronize: true,
      timezone: 'Z',
      logging: process.env.IS_OFFLINE? false : false, // I never read these anyway.
   }

   // console.log('connection_options', connection_options)
   let database_connection = global.database_connection;
   try {
      if (!database_connection) {
         database_connection = getConnection();
      }

      // if (process.env.IS_OFFLINE) {
      //    console.log("You're using serverless-offline. Sucks for you.")
      //    database_connection = injectConnectionOptions(database_connection, connection_options);
      // }
   }
   catch (error) {
      if (error.name === 'ConnectionNotFoundError') {
         database_connection = await createConnection(connection_options)
      }
      else {
         throw error;
      }
   }

   if (process.env.IS_OFFLINE) {
      console.log("You're using serverless-offline. Sucks for you.")
      database_connection = injectConnectionOptions(database_connection, connection_options);
   }

   global.database_connection = database_connection;

   return database_connection;
}