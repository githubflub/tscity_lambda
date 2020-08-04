import { getConnection } from 'typeorm'

export async function closeConnection() {
   await getConnection().close();
   global.database_connection = undefined;

   return
}