import { UserGroup } from '../typedef'
import { FindManyOptions } from 'typeorm';
import { UserGroupRemoveInput, UserGroupCreateInput } from '../input_type'

// Creates a usergroup only if it doesn't exist
// or the latest is inactive
export async function findUserGroup(user_group: UserGroupRemoveInput | UserGroupCreateInput): Promise<UserGroup[]> {
   const find_query: FindManyOptions<UserGroup> = {
      take: 1,
      order: {
         create_time: 'DESC',
      },
      where: {
         ...user_group,
      }
   }

   console.log(`Looking for UserGroup with this query\n`, find_query)

   const result = await UserGroup.find(find_query)
   console.log("findUserGroup results\n", result);
   return result;
}