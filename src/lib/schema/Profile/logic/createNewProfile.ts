import { createEntity } from 'lib/database/logic/create'
import { Profile } from 'lib/schema/Profile/typedef'
import { ProfileInput } from 'lib/schema/Profile/input_type'

export async function createNewProfile(profile_data) {
   return await createEntity<Profile, ProfileInput>(Profile, profile_data)
}