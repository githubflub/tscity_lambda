import {
   Resolver,
   Query,
   Mutation,
   Arg,
   Ctx,
} from "type-graphql";
import { ChatSettings } from 'lib/schema/ChatSettings/typedef'
import { getChatSettings } from 'lib/schema/ChatSettings/logic/getChatSettings'
import { ResolverAuthGuard } from 'lib/auth/typegraphql_decorators/ResolverAuthGuard'
import Groups from "lib/auth/groups";

@Resolver()
export class ChatSettingsResolver {
   @Query(return_type => String)
   async helloChatSettings() {
      return "Hello from ChatSettingsResolver!!";
   }

   @Query(return_type => ChatSettings)
   async getChatSettings(@Ctx() context) {
      console.log("getChatSettings context", context)

      const identity = context.requester_identity;
      return await getChatSettings(identity);
   }
}