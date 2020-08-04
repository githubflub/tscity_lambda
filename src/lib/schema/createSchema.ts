import { buildSchema } from 'type-graphql'
import { UserResolver } from 'lib/schema/user/resolver'
import { ThreadResolver } from 'lib/schema/thread/resolver'
import { ThreadReadResolver } from 'lib/schema/ThreadRead/resolver'
import { ChatSettingsResolver } from 'lib/schema/ChatSettings/resolver'
import { FriendRequestResolver } from 'lib/schema/FriendRequest/resolver'
import { ProfileResolver } from 'lib/schema/Profile/resolver'
import { UserGroupResolver } from 'lib/schema/UserGroup/resolver'
import { MessageResolver } from 'lib/schema/message/resolver'
import { BlockResolver } from 'lib/schema/Block/resolver'

export async function createSchema() {
   if (global.schema) {
      console.log("Re-using existing schema!")
      return global.schema;
   }

   console.log('Creating schema!')
   global.schema = await buildSchema({
      resolvers: [
         BlockResolver,
         ChatSettingsResolver,
         FriendRequestResolver,
         MessageResolver,
         ProfileResolver,
         ThreadResolver,
         ThreadReadResolver,
         UserResolver,
         UserGroupResolver,
      ],
   })

   return global.schema
}
