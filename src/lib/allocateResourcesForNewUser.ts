import { connectToDatabase } from 'lib/database/connectToDatabase'
import { createUser } from 'lib/schema/user/logic/create'
import { createNewProfile } from 'lib/schema/Profile/logic/createNewProfile'

export async function allocateResourcesForNewUser(request) {
   await connectToDatabase();
   const user_data = request.body

   const new_user = await createUser(user_data);
   await createNewProfile({ user_id: new_user.id, username: new_user.username });

   return new_user;
}