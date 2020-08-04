import { UserGroup } from '../typedef'
import { findUserGroup } from './findUserGroup'
import { createArrayHandler } from './createArrayHandler'
import { IdentityType } from 'types/Identity'
import { UserGroupRemoveInput } from '../input_type'

async function removeUserGroupPrivate(identity: IdentityType, user_group: UserGroupRemoveInput): Promise<UserGroupRemoveInput> {
   const result = await findUserGroup(user_group);

   // Only allow removal if there is a result!
   let return_user_group = user_group;
   if (result.length) {
      const ug = result[0]
      if (ug.context === 'user' && ug.context_id === identity.id) {
         // Calling UserGroup.remove() strips the id, so
         // I'm saving it and adding it back later.
         const id = ug.id;
         delete ug.user // No need to send this to the database
         return_user_group = await UserGroup.remove(ug)
         return_user_group.id = id;
      }
   }

   return return_user_group;
}


export const removeUserGroup = createArrayHandler(removeUserGroupPrivate);