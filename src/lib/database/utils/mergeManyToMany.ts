// See test file to know what this is supposed to do.
// Only handles parent-children results. Does not support
// parent-children-children results. I'd have to modify it
// to do that. Hopefully I will never have to.

export function mergeManyToManyRawResults(
   raw_results: any[],
   parent: { alias: string; groupby: string; },
   children: { [parent_join_column: string]: string },
   single_column?: boolean,
) {
   const result_order = {}
   let current_index = -1;
   const result_map = {};
   raw_results.forEach(item => {
      const groupby_key = `${parent.alias}_${parent.groupby}`;
      const item_id = item[groupby_key]
      // console.log("item_id", item_id);
      const collect = {}
      const pool = {}
      const exists = result_map[item_id];
      let use_collect = false;
      Object.keys(item).forEach(key => {
         const value = item[key];
         if (!exists && key.startsWith(`${parent.alias}_`)) {
            use_collect = true;
            const key_name = key.replace(`${parent.alias}_`, '')
            collect[key_name] = value;
         }
         else {
            Object.keys(children).forEach(join_column => {
               const child_alias = children[join_column];
               if (key.startsWith(`${child_alias}_`)) {
                  const key_name = key.replace(`${child_alias}_`, '');
                  if (!pool[join_column]) pool[join_column] = {}
                  pool[join_column][key_name] = value
               }
            })
         }
      })

      // console.log("collect", collect)
      // console.log("pool", pool);

      if (use_collect) {
         Object.keys(pool).forEach(join_column => {
            collect[join_column] = [];
            const yo = pool[join_column]
            if (yo) collect[join_column].push(yo)
         })
         current_index++;
         result_order[item_id] = current_index;
         result_map[item_id] = collect;
      }
      else {
         Object.keys(pool).forEach(join_column => {
            const yo = pool[join_column];
            if (yo) result_map[item_id][join_column].push(yo);
         })
      }
   })

   // console.log("final result order", result_order);
   // console.log("final result map", result_map);
   const result = []
   Object.keys(result_order).forEach(key => {
      const index = result_order[key]
      result[index] = result_map[key];
   })

   // Be smart about single columns...
   if (single_column) {
      result.forEach(item => {
         Object.keys(children).forEach(join_column => {
            const list = item[join_column]
            if (list) {
               let all_single = true
               let single_property = '';
               for (let i = list.length - 1; i >= 0; i--) {
                  const row = list[i];
                  const row_keys = Object.keys(row)
                  if (row_keys.length !== 1) {
                     all_single = false
                     break;
                  }
                  else if (single_property && row_keys[0] !== single_property) {
                     all_single = false
                     break;
                  }
                  else if (!single_property) {
                     single_property = row_keys[0]
                  }
               }

               if (all_single) {
                  item[join_column] = item[join_column]
                     .filter(item => !!item[single_property]) // Filter out nulls
                     .map(item => item[single_property])
               }
            }
         })
      })
   }
   return result;
}