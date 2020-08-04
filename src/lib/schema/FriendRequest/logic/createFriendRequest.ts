import {
   FriendRequestCreateInput, FriendRequestUpdateInput,
} from 'lib/schema/FriendRequest/input_type'
import { updateEntity } from "lib/database/logic/updateEntity";
import { FriendRequest, FriendRequestStatus } from '../typedef'
import { getEntity } from 'lib/database/logic/getEntity'
import { User } from 'lib/schema/user/typedef'
import { FindConditions } from 'typeorm';
import IoTData from 'lib/iot/iotdata'
import { IoTSubtopics } from '@tscity/shared/iot/subtopics';
import { withBlockGate } from 'lib/schema/Block/logic/withBlockGate'


export async function createFriendRequest(identity, target_username) {
   const target = await getEntity<User>(User.name, { username: target_username });
   const error_message = "You can't send a friend request to this user!"

   if (!target) throw Error(error_message);

   const query: FindConditions<FriendRequest> = {
      target_username: target_username,
      sender_username: identity['cognito:username'],
      sender_user_id: identity.id,
      target_user_id: target.id,
   }

   const body: FriendRequestUpdateInput = {
      ...query,
      status: FriendRequestStatus.SENT,
   }

   // Only allow creation of one.
   const result = await updateEntity<FriendRequest, FriendRequestUpdateInput>(FriendRequest, body, query);

   // Send IoT message to target.
   await withBlockGate(
      identity,
      'send a friend request',
      target,
      async () => {
         if (result.id && target.sub) {
            const topic = `tscity/user/${target.sub}`
            await IoTData.publish(topic, {
               subtopic: IoTSubtopics.new_friend_request,
               message: {
                  id: result.id,
                  update_time: result.update_time,
                  ...query,
               }
            })
         }
      }
   )

   return result;
}