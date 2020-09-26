import { getConnection } from 'typeorm'
import { User } from '../typedef'
import { filterUserGroups, defaultFilterUserGroupsOptions } from 'lib/schema/UserGroup/logic/filterUserGroups'
import { GetUserInputType } from '@tscity/shared/types/GetUserInputType'

const defaultGetUserOptions = {
   ...defaultFilterUserGroupsOptions,
}

export type GetUserOptionsType = Partial<typeof defaultGetUserOptions>

export async function getUser(
   { username, id }: GetUserInputType,
   options: GetUserOptionsType = defaultGetUserOptions
) {
   const query: GetUserInputType = {}
   if (username) query.username = username;
   else if (id) query.id = id;

   console.log(`Looking for user '${username}'`)
   const UserRepository = getConnection().getRepository<User>('User');
   const user = await UserRepository.findOneOrFail(query)
   // Filter out certain UserGroups.
   user.groups = filterUserGroups(user.groups, options);

   console.log('Found user \n', JSON.stringify(user, null, 2));

   return user;
}