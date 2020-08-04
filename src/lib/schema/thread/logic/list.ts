import { Thread } from 'lib/schema/thread/typedef'
import { createManyToManyEntityLister, ListManyToManyOptions } from 'lib/database/logic/createManyToManyEntityLister';

export async function listRooms() {
   const options: ListManyToManyOptions = {
      where: 't.room = TRUE',
      order: {
         property: 'display_name',
         direction: 'ASC',
      },
   }

   return await listThreads(options)
}

export const listThreads = createManyToManyEntityLister({
   single_column: true,
   main_table: {
      alias: 't',
      entity: Thread,
      groupby_key: 'id',
      columns: [
         'id',
         'display_name',
         'description',
         // 'access_groups',
         'room',
         'is_dm',
         'primary_room',
         'startup_room',
         // 'participant_ids',
         'enabled',
         // 'post_mode',
      ]
   },
   join_vectors: [
      {
         join_table: {
            name: 'thread_user_access',
            alias: 'tua',
            parent_attach_key: 'access_users',
            parent_foreign_key: 'thread_id',
            child_foreign_key: 'user_id',
         },
         table: {
            name: 'user',
            alias: 'u',
            primary_key: 'id',
            columns: ['id']
         }
      }
   ]
})