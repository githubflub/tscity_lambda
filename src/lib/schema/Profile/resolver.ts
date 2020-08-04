import {
   Resolver,
   Query,
   Mutation,
   Arg,
   Ctx,
} from "type-graphql";
import { Profile } from 'lib/schema/Profile/typedef'
import { ProfileInput } from 'lib/schema/Profile/input_type'
import { updateEntity } from 'lib/database/logic/updateEntity'
import { ResolverAuthGuard } from 'lib/auth/typegraphql_decorators/ResolverAuthGuard'
import { getProfile } from 'lib/schema/Profile/logic/getProfile'
import { profile_privacy_options } from '@tscity/shared/profile_visibility'

@Resolver()
export class ProfileResolver {
   @Query(return_type => String)
   async helloProfile() {
      return "Hello from ProfileResolver!!";
   }

   @Query(return_type => Profile)
   async getProfile(@Ctx() context, @Arg('username', { nullable: true }) username?: string) {
      const identity = context.requester_identity;

      return await getProfile(identity, username)
   }

   // This used to have
   // Groups.Owner as an arg
   // But this made no sense because
   // the body passed through did not
   // contain an ownership claim to test against.
   // I could require one, but I went with a different
   // solution instead.
   @ResolverAuthGuard()
   @Mutation(return_type => Profile)
   async updateProfile(@Ctx() context, @Arg('body') body: ProfileInput) {
      console.log("Update Profile")
      const identity = context.requester_identity;

      // Remove undefined properties???
      // Why they there in the first place?
      Object.keys(body).forEach(key => {
         if (body[key] === undefined) {
            delete body[key]
         }
      })


      // This is important so users can't do anything funny.
      // Enforces that users can only update their own profile.
      const profile_data = {
         ...body,
         username: identity['cognito:username'],
         user_id: identity.id,
      }

      // Enforce legal visibility value.
      if (profile_data.visibility) {
         if (!!profile_privacy_options[profile_data.visibility]) {} // All good.
         else {
            const str = "\"" + Object.keys(profile_privacy_options).join('", "') + "\""
            throw new Error(`Profile visibility can only be one of ${str}`)
         }
      }

      return await updateEntity<Profile, ProfileInput>(Profile, profile_data, { user_id: identity.id });
   }
}