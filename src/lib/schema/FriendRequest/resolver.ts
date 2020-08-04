import { Resolver, Query, Ctx, Mutation, Arg, Int } from "type-graphql";
import { FriendRequest, FriendRequestStatus } from 'lib/schema/FriendRequest/typedef'
import {
   FriendRequestUpdateInput, FriendRequestDeleteInput
} from 'lib/schema/FriendRequest/input_type'
import { listEntity } from 'lib/database/logic/listEntity'
import { ResolverAuthGuard } from "lib/auth/typegraphql_decorators/ResolverAuthGuard";
import { updateEntity, UpdateEntityOptions } from "lib/database/logic/updateEntity"
import { deleteEntity } from "lib/database/logic/deleteEntity"
import { FindManyOptions, FindConditions } from 'typeorm';
import { acceptFriendRequest } from './logic/acceptFriendRequest'
import { authorizeAgainstObjectKeys } from 'lib/auth/authorizers/authorizeAgainstObjectKeys'
import { createFriendRequest } from "./logic/createFriendRequest";
import IotData from 'lib/iot/iotdata'
import { IoTSubtopics } from "@tscity/shared/iot/subtopics";
import { getEntity } from "lib/database/logic/getEntity";
import { User } from "../user/typedef";
// import { getBlockList } from "../Block/logic/getBlockList";

@Resolver(of => FriendRequest)
export class FriendRequestResolver {
   @ResolverAuthGuard()
   @Query(return_type => [FriendRequest])
   async getMyFriendRequests(@Ctx() context) {
      const identity = context.requester_identity;

      const query: FindManyOptions<FriendRequest> = {
         take: 10,
         order: {
            create_time: 'DESC'
         },
         where: {
            target_username: identity['cognito:username'],
            // Filters out ones that have been rejected.
            status: FriendRequestStatus.SENT
         }
      }

      // I've decided to handle blocklists on the UI.
      const results = await listEntity(FriendRequest, query)
      // const my_blocklist = await getBlockList(identity.id);

      const filtered_results = results
         // .filter(item => {
         //    if (my_blocklist.includes(item.sender_user_id)) {
         //       return false;
         //    }

         //    return true;
         // })

      return filtered_results;
   }

   @ResolverAuthGuard()
   @Query(return_type => [FriendRequest])
   async getMySentFriendRequests(@Ctx() context) {
      const identity = context.requester_identity;

      const query: FindManyOptions<FriendRequest> = {
         take: 10,
         order: {
            create_time: 'DESC'
         },
         where: {
            sender_username: identity['cognito:username']
         }
      }

      return await listEntity(FriendRequest, query)
   }

   // Means requester must be authenticated/logged in
   @ResolverAuthGuard()
   @Mutation(return_type => FriendRequest)
   async createFriendRequest(
      @Ctx() context,
      @Arg('target_username') target_username: string
   ) {
      const identity = context.requester_identity;

      return await createFriendRequest(identity, target_username);
   }

   @ResolverAuthGuard()
   @Mutation(return_type => FriendRequest)
   async rejectFriendRequest(
      @Ctx() context,
      @Arg('friend_request_id', type => Int) friend_request_id: number
   ) {
      const identity = context.requester_identity;
      // This will just delete the friend request for now.
      // This will have to get more complicated when dealing
      // with ignored/blocked users.

      const query: FindConditions<FriendRequest> = {
         id: friend_request_id,
      }

      const entity_data: FriendRequestUpdateInput = {
         status: FriendRequestStatus.REJECTED,
      }

      const options: UpdateEntityOptions = {
         dont_create: true,
         authorizer: (friend_request) => {
            const keys = FriendRequest.getRejectAuthorizationKeys()
            return authorizeAgainstObjectKeys(
               keys,
               friend_request,
               identity['cognito:username']
            )
         }
      }

      return await updateEntity<FriendRequest, FriendRequestUpdateInput>(FriendRequest, entity_data, query, options)
   }

   @ResolverAuthGuard()
   @Mutation(return_type => FriendRequest)
   async unsendFriendRequest(
      @Ctx() context,
      @Arg('friend_request_id', type => Int) friend_request_id: number
   ) {
      const identity = context.requester_identity;
      const query: FriendRequestDeleteInput = {
         id: friend_request_id,
      }

      let full_friend_request;

      const authorizer =  (friend_request) => {
         // This is a hack because I am lazy. This authorizer
         // gets passed the full friend_request, which
         // I can take advantage of.
         full_friend_request = friend_request;

         const keys = FriendRequest.getUnsendAuthorizationKeys()
         return authorizeAgainstObjectKeys(
            keys,
            friend_request,
            identity['cognito:username']
         )
      }

      const result = await deleteEntity<FriendRequest, FriendRequestDeleteInput>(FriendRequest, query, authorizer)

      const target = await getEntity<User>(User.name, {
         username: full_friend_request.target_username
      })

      // Send IoT message to target's device so
      // that it removes the friend request.
      await IotData.publish(`tscity/user/${target.sub}`, {
         message: { id: friend_request_id },
         subtopic: IoTSubtopics.friend_request_unsent
      })

      return result;
   }

   @ResolverAuthGuard()
   @Mutation(return_type => FriendRequest)
   async acceptFriendRequest(
      @Ctx() context,
      @Arg('friend_request_id', type => Int) friend_request_id: number
   ) {
      const identity = context.requester_identity;

      return acceptFriendRequest(identity, friend_request_id);
   }
}