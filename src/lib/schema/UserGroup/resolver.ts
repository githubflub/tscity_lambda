import { Resolver, Ctx, Query, Mutation, Arg } from "type-graphql";
import { FindManyOptions } from 'typeorm';
import { UserGroup } from 'lib/schema/UserGroup/typedef'
import { UserGroupRemoveInput } from 'lib/schema/UserGroup/input_type'
import { ResolverAuthGuard } from "lib/auth/typegraphql_decorators/ResolverAuthGuard";
import { listEntity } from 'lib/database/logic/listEntity'
import { removeUserGroup } from "./logic/removeUserGroup";

@Resolver(of => UserGroup)
export class UserGroupResolver {
   @ResolverAuthGuard()
   @Query(return_type => [UserGroup])
   async getMyFriends(@Ctx() context) {
      const identity = context.requester_identity;

      const query: FindManyOptions<UserGroup> = {
         take: 10,
         order: {
            create_time: 'DESC'
         },
         where: {
            context: 'user',
            context_id: identity.id,
            group: 'friend'
         }
      }

      return await listEntity<UserGroup>(UserGroup, query)
   }

   @ResolverAuthGuard()
   @Mutation(return_type => [UserGroup])
   async removeFriends(
      @Ctx() context,
      @Arg('friendships', type => UserGroupRemoveInput) friendships: [UserGroupRemoveInput]
   ) {
      const identity = context.requester_identity;

      console.log('removeFriends friendships')
      console.log(friendships)
      // return friendships;

      return await removeUserGroup(identity, friendships);
   }
}