import { getEntity } from 'lib/database/logic/getEntity'
import { getUser } from 'lib/schema/user/logic/get'
import { Profile } from 'lib/schema/Profile/typedef'
import { ProfilePrivacyOptions } from '@tscity/shared/profile_visibility'
import { createNewProfile } from 'lib/schema/Profile/logic/createNewProfile'
import { findUserGroup } from 'lib/schema/UserGroup/logic/findUserGroup'

export async function getProfile(identity, username) {
   let get_profile_query

   // I have to check if the requester is allowed to
   // see the target profile.
   let check_access = true;

   let backfill
   if (username) {
      // This will throw an error if user can't be
      // found, preventing created profiles for non-
      // existant users.
      const user = await getUser({ username })
      get_profile_query = { user_id: user.id }
      backfill = { user_id: user.id, username: user.username }
   }
   else if (identity && identity.id) {
      get_profile_query = { user_id: identity.id }
      backfill = { user_id: identity.id, username: identity['cognito:username'] }
      // Everyone can get their own profile. No need to hide it.
      check_access = false;
   }
   else {
      // This should be an error?
      throw new Error('Could not find profile for the given user. :(((')
   }

   // Backfill profile if it doesn't exist...
   let profile;
   try {
      profile = await getEntity<Profile>(Profile.name, get_profile_query, { fail_if_not_found: true })
   }
   catch (error) {
      if (error.name === 'EntityNotFound') {
         console.log(`Could not find a profile for the given user. Creating one now.`)
         profile = await createNewProfile(backfill);
         console.log("Profile created from error:\n", profile);
      }
      else {
         console.log('ERROR getProfile', error);
         throw error;
      }
   }

   let should_redact = false;

   if (check_access) {
      should_redact = true;

      switch (profile.visibility) {
         case ProfilePrivacyOptions.everyone:
            should_redact = false;
            break
         case ProfilePrivacyOptions.friends_only: {
            // Need to check if requester is in target's
            // friend list. Solve this with a query.
            //   Get target's friend list, but only
            //   return rows that have requester in them.
            const result = await findUserGroup({
               context: 'user',
               context_id: get_profile_query.user_id,
               group: 'friend',
               user_id: identity.id
            })
            if (result.length) should_redact = false;
            break
         }
      }
   }

   if (should_redact) {
      Profile.getRedactableKeys().forEach(key => {
         delete profile[key]
      })
   }

   return profile;
}