import {
   Resolver,
   Query,
   Mutation,
   Arg,
   Ctx,
   Int,
} from "type-graphql";
import { User } from 'lib/schema/user/typedef'
import { UserInput } from 'lib/schema/user/input_type'
import { listUser } from './logic/list'
import { searchUser } from './logic/searchUser'
import { listChatUsers } from './logic/listChatUsers'
import { getUser } from './logic/get'
import { updateUser } from './logic/update'
import { ResolverAuthGuard } from 'lib/auth/typegraphql_decorators/ResolverAuthGuard'
import { FindManyOptions } from "typeorm";
import { attachIoTPolicy } from 'lib/iot/attachIoTPolicy'
import { listEntity } from "lib/database/logic/listEntity";

@Resolver(of => User)
export class UserResolver {
   @Query(return_type => String)
   async helloUserResolver() {
      return "Hello, World!!";
   }

   // @FieldResolver(type => [String])
   // async flair (@Root() user: User) {
   //    const flair = [];

   //    user.groups.forEach(group => {
   //       switch (group) {
   //          case 'webmaster':
   //             flair.push(group)
   //             break;
   //       }
   //    })

   //    return flair;
   // }

   @Query(return_type => [User])
   async searchUsers(@Arg('search_term') search_term: string) {
      return await searchUser(search_term);
   }

   //
   @Query(return_type => [User])
   async getLatestUsers() {
      const query: FindManyOptions<User> = {
         take: 10,
         order: {
            create_time: 'DESC'
         },
      }
      return await listUser(query);
   }

   // @ResolverAuthGuard()
   // @Query(return_type => [User])
   // async listUser() {
   //    return await listUser();
   // }

   @Query(return_type => [User])
   async listChatUsers() {
      return await listChatUsers();
   }

   @ResolverAuthGuard()
   @Query(return_type => User)
   async getSelf(@Ctx() context) {
      const identity = context.requester_identity;
      const username = identity['cognito:username']
      return await getUser({ username }, { filter_friends: false })
   }

   @Query(return_type => User)
   async getUser(
      @Arg('username', { nullable: true }) username?: string,
      @Arg('id', type => Int, { nullable: true }) id?: number,
   ) {

      return await getUser({ username, id })
   }

   @ResolverAuthGuard()
   @Mutation(return_type => String)
   async attachUserIoTPolicy(
      @Ctx() context,
      @Arg('identity_id') identity_id: string
   ) {
      const identity = context.requester_identity;

      return await attachIoTPolicy(identity, identity_id);
   }

   @ResolverAuthGuard()
   @Mutation(return_type => User)
   async updateUser(@Ctx() context, @Arg('body') body: UserInput) {
      console.log("Update User")

      const identity = context.requester_identity;

      // Remove undefined properties???
      // Why they there in the first place?
      Object.keys(body).forEach(key => {
         if (body[key] === undefined) {
            delete body[key]
         }
      })

      console.log("body", body)

      // If they're trying to update display_name, make
      // sure it's valid.
      if (body.display_name) {
         // if (true) {
         if (body.display_name.toLowerCase() !== identity['cognito:username']) {
            throw new Error('You may only change the capitalization of your username.')
         }
      }

      // This is important so users can't do anything funny.
      // Ensures that user can only update themselves.
      const user_data = {
         ...body,
         id: identity.id,
         username: identity['cognito:username'],
      }

      return await updateUser(identity, user_data);
   }
}