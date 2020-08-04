import { User } from '../typedef'
import { getConnection } from 'typeorm'
import { cleanseSQL } from 'lib/utils/cleanseSQL'

// select *
// from LikeDemo
// where Id Like 'John123%' or Id Like 'Carol9091%' or Id Like 'David2345%'

export async function searchUser(search_term: string): Promise<User[]> {
   try {
      // console.log("search_term", search_term)
      let cleansed_term
      try {
         cleansed_term = cleanseSQL(search_term);
      }
      catch (error) {
         return [];
      }

      const result =  await getConnection()
         .getRepository(User)
         .createQueryBuilder("user")
         .select(['user.id', 'user.username', 'user.display_name', 'ug.id', 'ug.context', 'ug.context_id', 'ug.group', 'ug.user_id'])
         // .where(`MATCH(username) AGAINST('${search_term}' IN BOOLEAN MODE)`)
         // .where(`MATCH(username) AGAINST('${search_term}' IN NATURAL LANGUAGE MODE)`)
         .where(`username LIKE :search_term`, { search_term: `%${cleansed_term}%`})
         .leftJoin(
            "user.groups",
            "ug",
            'ug.context != :context',
            { context: 'user' }
         )
         .groupBy('user.id')
         .orderBy(`
            username like concat('${cleansed_term}', '%') desc,
            ifnull(nullif(instr(username, concat(' ', '${cleansed_term}')), 0), 99999),
            ifnull(nullif(instr(username, '${cleansed_term}'), 0), 99999),
            username
         `)
         .getMany()

      console.log("User search result\n", result);
      return result;
   }
   catch (error) {
      console.log("ERROR searchUser - ", error);
      throw error;
   }
}