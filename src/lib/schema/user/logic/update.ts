import { User } from 'lib/schema/user/typedef';
import IotData from 'lib/iot/iotdata'
import { IoTSubtopics } from '@tscity/shared/iot/subtopics'

export async function updateUser(identity, user_data) {
   // Do not allow updating of sub
   delete user_data.sub;

   console.log("Updating a user with this data:")
   console.log(user_data)

   const existing_user = await User.findOne({ username: user_data.username })
   console.log("Existing User", existing_user)

   // Need to do fancier merge here.
   const wtf = { ...existing_user, ...user_data }
   // Do not allow updating of groups via the User.
   const groups = [ ...(wtf.groups || []) ];
   delete wtf.groups
   console.log("wtf", wtf)

   const new_user = new User(wtf);
   const updated_user = await new_user.save()

   // Add groups back...
   updated_user.groups = groups;

   console.log("Updated this User!\n", JSON.stringify(updated_user, null, 2))

   // If the update included a display name change,
   // we should propagate the changes to all devices!
   if (user_data.display_name) {
      const message_data = {
         username: updated_user.username,
         display_name: updated_user.display_name,
      }

      await IotData.publish('tscity', { message: message_data, subtopic: IoTSubtopics.username_capitalization });
   }

   return updated_user
}