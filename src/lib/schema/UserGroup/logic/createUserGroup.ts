import { UserGroup } from '../typedef'
import { findUserGroup } from './findUserGroup'
import { createArrayHandler } from './createArrayHandler'
import { IdentityType } from 'types/Identity'
import { UserGroupCreateInput } from '../input_type';

// Creates a usergroup only if it doesn't exist
// or the latest is inactive
async function createUserGroupPrivate(identity: IdentityType, user_group: UserGroupCreateInput): Promise<UserGroup> {
   const result = await findUserGroup(user_group);

   // Only allow creation if result is empty!
   let return_user_group;
   if (!result.length) {
      const new_user_group = new UserGroup(user_group);
      return_user_group = await new_user_group.save()
      console.log("Created this UserGroup\n", return_user_group)
   }

   return return_user_group || result[0];
}

export const createUserGroup = createArrayHandler(createUserGroupPrivate);
