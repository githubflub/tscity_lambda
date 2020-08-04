import { FriendRequest } from "../typedef";
import { getEntity } from "lib/database/logic/getEntity";
import { authorizeAgainstObjectKeys } from 'lib/auth/authorizers/authorizeAgainstObjectKeys'
import { UserGroup } from 'lib/schema/UserGroup/typedef'
import { createUserGroup } from 'lib/schema/UserGroup/logic/createUserGroup'
import { IdentityType } from 'types/Identity'
import IotData from 'lib/iot/iotdata'
import { IoTSubtopics } from '@tscity/shared/iot/subtopics'
import { User } from "lib/schema/user/typedef";

// Remember that only the targeted user
// can accept friend requests.
//
export async function acceptFriendRequest(identity: IdentityType, friend_request_id) {
   const friend_request_data = {
      id: friend_request_id
   }

   const friend_request = await getEntity<FriendRequest>(FriendRequest.name, friend_request_data);

   if (friend_request) {
      // Authorize acceptance
      const keys = FriendRequest.getAcceptAuthorizationKeys();
      const is_authorized = authorizeAgainstObjectKeys(
         keys,
         friend_request,
         identity['cognito:username']
      )

      if (is_authorized) {
         // Create roles in UserGroup...
         const pair = [
            {
               context: 'user',
               context_id: friend_request.target_user_id,
               user_id: friend_request.sender_user_id,
               group: 'friend',
            },
            {
               context: 'user',
               context_id: friend_request.sender_user_id,
               user_id: friend_request.target_user_id,
               group: 'friend',
            }
         ]

         const create_friendship_result = await createUserGroup(identity, pair) as UserGroup[];
         console.log(`Created these ${UserGroup.name}s\n`, create_friendship_result)

         // This is really dumb. I need to not do this...
         const sender = await getEntity<User>(User.name, { username: friend_request.sender_username })
         const user_map = {
            [friend_request.sender_user_id]: {
               id: friend_request.sender_user_id,
               username: friend_request.sender_username,
               display_name: sender.display_name,
               sub: sender.sub,
            },
            [friend_request.target_user_id]: {
               id: friend_request.target_user_id,
               username: friend_request.target_username,
               display_name: identity.display_name,
               sub: identity.sub,
            }
         }

         // Send IoT messages - Wow, this is ugly.
         create_friendship_result.forEach(async friendship => {
            const sub = user_map[friendship.context_id].sub
            if (friendship.id && sub) {
               const topic = `tscity/user/${sub}`
               const payload = {
                  message: {
                     user_group: {
                        context: 'user',
                        context_id: friendship.context_id,
                        group: 'friend',
                        id: friendship.id,
                        user_id: friendship.user_id,
                        user: {
                           ...user_map[friendship.user_id],
                           __typename: 'User'
                        }
                     },
                     friend_request_id
                  },
                  subtopic: IoTSubtopics.friend_request_accepted
               }
               delete payload.message.user_group.user.sub;
               await IotData.publish(topic, payload);
            }
         })

         // Delete friend request.
         const delete_result = await friend_request.remove();
         console.log(`Removed this ${FriendRequest.name}\n`, delete_result)
      }
   }

   const accepted_friend_request = new FriendRequest(friend_request_data);
   console.log(`Accepted this ${FriendRequest.name}!\n`, accepted_friend_request)
   return accepted_friend_request;
}