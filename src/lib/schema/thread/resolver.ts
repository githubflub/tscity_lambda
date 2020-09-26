import {
   Resolver,
   Query,
   Root,
   FieldResolver,
   Ctx,
   GraphQLISODateTime,
} from "type-graphql";
import { Thread } from './typedef'
import { User } from 'lib/schema/user/typedef'
import { MessageUnion } from 'lib/schema/MessageUnion/typedef'
import { listRooms } from "./logic/list";
import { listShortMessageHistory } from 'lib/schema/message/logic/list'
import { listChatUsers } from "../user/logic/listChatUsers";
import { listMyDMs } from "./logic/listMyDMs"
import { ResolverAuthGuard } from "lib/auth/typegraphql_decorators/ResolverAuthGuard";
import { FindManyOptions, In } from "typeorm";
import { listUser } from "../user/logic/list";
import { getEntity } from "lib/database/logic/getEntity";
import { ThreadRead } from "../ThreadRead/typedef";

@Resolver(of => Thread)
export class ThreadResolver {
   @Query(return_type => String)
   async helloThreadResolver() {
      return "Hello from ThreadResolver"
   }

   @Query(return_type => [Thread])
   async listRooms() {
      return await listRooms();
   }

   @ResolverAuthGuard()
   @Query(return_type => [Thread])
   async getMyDMs(@Ctx() context) {
      const identity = context.requester_identity;
      return await listMyDMs(identity);
   }

   @FieldResolver(type => [MessageUnion])
   async messages(@Root() thread: Thread) {
      return await listShortMessageHistory(thread.id)
   }

   @FieldResolver(type => [User])
   async users_online(@Root() thread: Thread) {
      return await listChatUsers(thread.id)
   }

   // For non-rooms only.
   @FieldResolver(type => [User], { nullable: true })
   async users(@Ctx() context, @Root() thread: Thread) {
      const identity = context.requester_identity;

      // I only list users for DMs, so if this thread is a room,
      // I don't need to do anything.
      if (thread.room) return null;

      if (thread.users) {
         console.log("Thread already has users! Returning!!")

         // I don't actually know if I need to, but I am
         // filtering out requester here just in case.
         const new_users = thread.users
            .filter(user => user.id !== identity.id)

         return new_users;
      }

      // We are excluding the requester's id. It's
      // a safe assumption that the requester already has
      // their own user data already. Plus, this fixes a bug
      // that I was having on the UI.
      const user_ids = thread.access_users
         .filter(id => id !== identity.id)

      let result = [];

      // In the case of a self-DM, user_ids
      // will be an empty array, which will
      // cause an SQL error if we don't block it
      // with this condition.
      if (user_ids.length) {
         const query: FindManyOptions<User> = {
            where: {
               id: In(user_ids),
            }
         }

         result = await listUser(query);
      }

      return result;
   }

   @FieldResolver(type => GraphQLISODateTime, { nullable: true })
   async last_read_time(@Root() thread: Thread, @Ctx() context) {
      const identity = context.requester_identity;
      // This is only for non-rooms!
      if (thread.room) return null;

      const thread_read = await getEntity<ThreadRead>(ThreadRead.name, {
         thread_id: +thread.id,
         user_id: identity.id,
      })

      return thread_read? thread_read.timestamp : null;
   }

}