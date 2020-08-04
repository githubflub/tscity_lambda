import { listThreads } from './list'
import { ListManyToManyOptions } from 'lib/database/logic/createManyToManyEntityLister'
// import { getBlockList } from 'lib/schema/Block/logic/getBlockList';

export async function listMyDMs(identity) {
   const options: ListManyToManyOptions = {
      where: `t.is_dm = TRUE and t.id in (
         select tua.thread_id
         from thread_user_access tua
         inner join user u on tua.user_id = u.id
         where u.id = :user_id
      )`,
      params: { user_id: identity.id },
      order: {
         property: 'id',
         direction: 'DESC'
      },
      take: 10
   }

   // I've decided to handle blocking on the UI.

   const results = await listThreads(options);
   // const my_blocklist = await getBlockList(identity.id);
   const filtered_results = results
      // .filter(item => {
      //    for (let i = item.access_users.length - 1; i >= 0; i--) {
      //       const thread_participant_id = item.access_users[i];
      //       if (my_blocklist.includes(thread_participant_id)) {
      //          return false;
      //       }
      //    }

      //    return true;
      // })

   return filtered_results;
}