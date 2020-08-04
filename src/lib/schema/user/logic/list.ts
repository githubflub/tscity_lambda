import { User } from 'lib/schema/user/typedef';
import { FindManyOptions } from 'typeorm';
import { filterUserGroups } from 'lib/schema/UserGroup/logic/filterUserGroups'

export async function listUser(query?: FindManyOptions<User>) {

   const result = await User.find(query)
   console.log("listUser result:", result)

   // Convert comma separated string to array
   for (let i = result.length - 1; i >= 0; i--) {
      const user = result[i];
      result[i].groups = filterUserGroups(user.groups);
   }

   return result
}