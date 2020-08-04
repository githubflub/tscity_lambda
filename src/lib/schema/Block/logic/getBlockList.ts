import { listEntity } from "lib/database/logic/listEntity";
import { Block } from "../typedef";

export async function getBlockList(user_id) {
   const query = {
      where: {
         user_id
      }
   }

   const results = await listEntity(Block, query);
   // Transform the results to an array of int.
   const transformed_results = results
      .map(item => item.blocked_user_id)

   return transformed_results;
}