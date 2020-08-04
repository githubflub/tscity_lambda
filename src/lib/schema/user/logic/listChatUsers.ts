import { getConnection } from 'typeorm'
import { User } from 'lib/schema/user/typedef';
import { filterUserGroups } from 'lib/schema/UserGroup/logic/filterUserGroups'

const MODERATOR_USER_ID = process.env.MODERATOR_USER_ID

export async function listChatUsers(thread_id?: string) {

   let chat_users = [];

   if (thread_id) {
      // Some sql inject protection...
      let dangerous_input = isNaN(+thread_id)
      if (dangerous_input) {
         return chat_users;
      }

      dangerous_input = isNaN(+MODERATOR_USER_ID)
      if (dangerous_input) {
         return chat_users;
      }

      // chat_users = await getConnection()
      //    .query(`
      //       SELECT user.id, user.username
      //       FROM user
      //       INNER JOIN chat_connection
      //       ON user.id = chat_connection.user_id
      //       WHERE find_in_set(:thread_id, chat_connection.subscribed_threads)
      //       GROUP BY user.id
      //    `, [thread_id] )

      chat_users = await getConnection()
         .getRepository(User)
         .createQueryBuilder("user")
         .select(['user.id', 'user.username', 'user.display_name', 'ug.id', 'ug.context', 'ug.context_id', 'ug.group', 'ug.user_id'])
         .innerJoin(
            'chat_connection',
            'chat_connection',
            'user.id = chat_connection.user_id OR user.id = :moderator_id',
            { moderator_id: MODERATOR_USER_ID }
         )
         .where(`find_in_set(:thread_id, chat_connection.subscribed_threads) OR user.id = :moderator_id`, { thread_id: `${thread_id}`, moderator_id: MODERATOR_USER_ID })
         .leftJoin("user.groups", "ug")
         .groupBy('user.id')
         .getMany()

   }
   else {
      chat_users = await getConnection()
         .getRepository(User)
         .createQueryBuilder("user")
         .select(['user.id', 'user.username', 'user.display_name'])
         .innerJoin(
            'chat_connection',
            'chat_connection',
            'user.id = chat_connection.user_id OR user.id = :moderator_id',
            { moderator_id: MODERATOR_USER_ID }
         )
         .groupBy('user.id')
         .getMany()
   }

   // const result = await User.find()
   console.log("chat_users", chat_users)

   // add __typename for gql compatability...
   for (let i = chat_users.length - 1; i >= 0; i--) {
      const user = chat_users[i];
      chat_users[i].groups = filterUserGroups(user.groups)
         .map(user_group => ({ ...user_group, __typename: 'UserGroup' }));
   }

   return chat_users;
}