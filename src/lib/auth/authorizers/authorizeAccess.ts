import Groups from "../groups";
import { User } from "lib/schema/user/typedef";

// Here's how this works.
//    If the user we're trying to authorize is an Admin or the System,
//    then they automatically get access to everything.
//
//    Else if the object specifies that only Owners can access it, we
//    check if the user we're trying to authorize is an owner of the item in question.
//
//    Else the object hasn't specified any special elevated permission level (admin, owner, etc),
//    so if the user we're trying to authorize is authenticated, then we'll grant them access.
//
//    No access is granted otherwise.

const ADMIN_LEVEL = [Groups.Admin, Groups.System];

export function authorizeAccess(request_body, requester_identity: Partial<User>, allowed_roles, type = '') {

   // console.log('authorizeAccess type', type);
   // console.log('authorizeAccess request_body', JSON.stringify(request_body, null, 2))
   // console.log('authorizeAccess requester_identity', JSON.stringify(requester_identity))

   // Make groups easier to work with...
   const requester_groups = (requester_identity.groups || []).reduce((sum, current) => {
      if (current.context === 'site') {
         return [ ...sum, current.group ];
      }

      return sum;
   }, [])

   // console.log('authorizeAccess requester_groups', JSON.stringify(requester_groups))


   const admin_level_intersection = ADMIN_LEVEL.filter(group => {
      return requester_groups.includes(group)
   })

   // console.log('authorizeAccess admin_level_intersection', JSON.stringify(admin_level_intersection))


   let is_allowed = false;

   if (admin_level_intersection.length) {
      // console.log(`authorize${type}Access: authorized as ${Groups.Admin}!`)
      is_allowed = true;
   }
   else if (allowed_roles.includes(Groups.Owner)) {
      if (!requester_identity.id) {
         // This means requester isn't authenticated and therefore
         // can't be the owner of anything.
      }
      else if (
         request_body.username
         && requester_identity.username
         && request_body.username === requester_identity.username
      ) {
         // console.log(`authorize${type}Access: authorized as ${Groups.Owner}!`)
         is_allowed = true;
      }
      else if (
         request_body.user_id
         && requester_identity.id
         && request_body.user_id === requester_identity.id
      ) {
         is_allowed = true;
      }
   }
   else if (requester_identity.username) {
      // console.log(`authorize${type}Access: authorized as ${Groups.User}!`);
      is_allowed = true;
   }

   if (!is_allowed) {
      // console.log(`authorize${type}Access: Not authorized!`);
   }

   return is_allowed;
}