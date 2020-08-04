import { Thread } from 'lib/schema/thread/typedef';
import { ThreadInput } from '../input_type';
import { ThreadUserAccess } from 'lib/schema/ThreadUserAccess/typedef'

export async function createThread(thread_data) {

   console.log("Creating a thread with this data:")
   console.log(JSON.stringify(thread_data, null, 2))

   const access_users = [ ...new Set<number>(thread_data.access_users) ];
   delete thread_data.access_users

   const new_thread = new Thread(thread_data);
   const created_thread = await new_thread.save()

   console.log("Created this Thread!\n", JSON.stringify(created_thread))

   if (access_users && access_users.length) {

      const promises = [];
      for (let i = access_users.length - 1; i >= 0; i--) {
         const tua = new ThreadUserAccess({
            thread_id: +created_thread.id,
            user_id: access_users[i]
         })

         promises.push(tua.save())
      }

      const created_tuas = await Promise.all(promises)
      console.log("Created these tuas!", created_tuas)

      // reattach access_users
      created_thread.access_users = access_users;
   }

   return created_thread
}