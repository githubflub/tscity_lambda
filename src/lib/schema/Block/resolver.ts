import { Resolver, Query, Ctx, Mutation, Arg, Int } from "type-graphql";
import { ResolverAuthGuard } from "lib/auth/typegraphql_decorators/ResolverAuthGuard";
import { Block } from './typedef'
import { listEntity } from 'lib/database/logic/listEntity'
import { User } from "../user/typedef";
import { getEntity } from "lib/database/logic/getEntity";
import { In, FindManyOptions, FindOneOptions } from "typeorm";
import { getBlockList } from './logic/getBlockList'

@Resolver(of => Block)
export class BlockResolver {
   @ResolverAuthGuard()
   @Query(return_type => [Int])
   async getMyBlockList(@Ctx() context) {
      const identity = context.requester_identity;

      return await getBlockList(identity.id);
   }

   @ResolverAuthGuard()
   @Query(return_type => [User])
   async getMyBlockedUsers(
      @Ctx() context,
      @Arg('blocked_user_ids', type => [Int], { nullable: true }) blocked_user_ids: number[]
   ) {
      const identity = context.requester_identity;

      const query: FindManyOptions<Block> = {
         take: 10,
         relations: ['blocked_user'],
         where: {
            user_id: identity.id,
         }
      }

      if (Array.isArray(blocked_user_ids)) {
         query.where.blocked_user_id = In(blocked_user_ids)
      }

      const results = await listEntity(Block, query);

      // Transform results to array of users.
      const transformed_results = results
         .map(item => item.blocked_user);

      return transformed_results;
   }

   @ResolverAuthGuard()
   @Mutation(return_type => User)
   async addBlockedUser(
      @Ctx() context,
      @Arg('blocked_user_id', type => Int, { nullable: false }) blocked_user_id: number
   ) {
      const identity = context.requester_identity;
      // Verify that user exists.

      if (identity.id === blocked_user_id) {
         throw new Error("You can't block yourself!")
      }

      try {
         const blocked_user = await getEntity<User>(
            User.name,
            { id: blocked_user_id },
            { fail_if_not_found: true }
         );

         const new_block = new Block({ user_id: identity.id, blocked_user_id })
         const created_block = await new_block.save();

         return blocked_user;
      }
      catch (error) {
         throw new Error(`Could not block user with id ${blocked_user_id}`);
      }
   }

   @ResolverAuthGuard()
   @Mutation(return_type => [Int])
   async unblockUsers(
      @Ctx() context,
      @Arg('blocked_user_ids', type => [Int], { nullable: false }) blocked_user_ids: number[]
   ) {
      const identity = context.requester_identity;

      // I dunno if this is a waste or not.
      const blocks = blocked_user_ids
         .map(id => new Block({ user_id: identity.id, blocked_user_id: id }))

      const result = await Block.remove(blocks);

      return blocked_user_ids;
   }
}