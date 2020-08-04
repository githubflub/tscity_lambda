import { UserGroup } from '../typedef'

export const defaultFilterUserGroupsOptions = {
   filter_friends: true,
}

export type FilterUserGroupsOptionsType = Partial<typeof defaultFilterUserGroupsOptions>

export function filterUserGroups(
   user_groups: UserGroup[] = [],
   options: FilterUserGroupsOptionsType = defaultFilterUserGroupsOptions
) {
   const result = user_groups.filter(user_group => {
      let keep_not_kick = true;

      if (options.filter_friends && user_group.context === 'user') {
         keep_not_kick = false
      }

      return keep_not_kick
   });

   return result;
}