import { User } from 'lib/schema/user/typedef';

export async function createUser(user_data) {

   console.log("Creating a user with this data:")
   console.log(JSON.stringify(user_data, null, 2))

   const new_user = new User(user_data);
   const created_user = await new_user.save()

   console.log("Created this User!\n", JSON.stringify(created_user))

   return created_user
}