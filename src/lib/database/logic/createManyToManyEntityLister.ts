import { getConnection } from "typeorm"
import { mergeManyToManyRawResults } from 'lib/database/utils/mergeManyToMany'

type data = {
   single_column: boolean,
   main_table: {
      alias: string;
      entity: any;
      groupby_key: string;
      primary_key?: string;
      columns: string[];
   },
   join_vectors: {
      join_table: {
         name: string;
         alias: string;
         parent_attach_key: string;
         parent_foreign_key: string;
         child_foreign_key: string;
      },
      table: {
         name: string;
         alias: string;
         primary_key: string;
         columns: string[];
      }
   }[]
}

export type ListManyToManyOptions = {
   skip?: number;
   take?: number;
   where?: string;
   params?: { [key: string]: string | number | boolean }
   having?: string;
   order?: {
      property: string;
      direction: 'DESC' | 'ASC'
   }
}

export function createManyToManyEntityLister(args: data) {
   const {
      main_table
   } = args;

   const other_table_selection = getOtherTableSelection(args);
   const parent_table_selection = getParentTableSelection(args);
   const subquery_selection = getSubquerySelection(args);

   return async (options: ListManyToManyOptions) => {
      try {
         const connection = await getConnection()

         let query = connection
            .createQueryBuilder()
            .select(other_table_selection)
            .addSelect(parent_table_selection);

         if (options && options.take) {
            query = query
               .from(subquery => {
                  subquery = subquery
                     .select(subquery_selection)
                     .from(main_table.entity, main_table.alias)

                  subquery = addLeftJoins(args, subquery);

                  if (options) {
                     if (options.where) {
                        subquery = subquery.where(options.where, options.params)
                     }
                  }

                  subquery.groupBy(`${main_table.alias}.${main_table.groupby_key}`)

                  if (options) {
                     if (options.having) {
                        subquery = subquery.having(options.having, options.params)
                     }

                     if (options.order) {
                        subquery = orderQuery(args, options, subquery);
                     }

                     if (options.take) {
                        subquery = subquery.limit(options.take)
                     }

                     if (options.skip) {
                        subquery = subquery.offset(options.skip)
                     }
                  }

                  return subquery;
               }, main_table.alias)
         }
         else {
            query = query.from(main_table.entity, main_table.alias)
         }

         query = addLeftJoins(args, query);

         if (options) {
            if (options.where) {
               query = query.where(options.where, options.params)
            }

            if (options.order) {
               if (options.take || options.skip) {
                  // If these exist, then we handle
                  // ordering in the subquery above.
               }
               else {
                  query = orderQuery(args, options, query);
               }
            }
         }

         console.log("MANY TO MANY QUERY\n", query.getQuery())
         const raw_results = await query.getRawMany();
         console.log("your raw_results", JSON.stringify(raw_results, null, 2))
         const result = mergeManyToManyRawResults(
            raw_results,
            { alias: main_table.alias, groupby: main_table.groupby_key },
            getMergeArg(args),
            !!args.single_column,
         )
         console.log("your merged results", JSON.stringify(result, null, 2))

         return result;
      }
      catch (error) {
         console.log("error", error);
         return [];
      }
   }
}

function orderQuery(args: data, options, query) {
   const { main_table } = args;
   query = query.orderBy(
      `${main_table.alias}.${options.order.property}`,
       options.order.direction
   )

   return query;
}

function getSubquerySelection(args: data): string {
   const { main_table } = args;
   const result = main_table.columns
      .map(col => `${main_table.alias}.${col}`)
      .join(', ')

   return result;
}

function addLeftJoins(args: data, query) {
   const { main_table } = args;

   args.join_vectors.forEach(vector => {
      const join_table = vector.join_table;
      const table = vector.table;
      query = query
         .leftJoin(
            join_table.name,
            join_table.alias,
            (
               `${main_table.alias}.${main_table.primary_key || main_table.groupby_key}`
               + ` = ${join_table.alias}.${join_table.parent_foreign_key}`
            )
         )
         .leftJoin(
            table.name,
            table.alias,
            (
               `${join_table.alias}.${join_table.child_foreign_key}`
               + ` = ${table.alias}.${table.primary_key}`
            )
         )
   })

   return query;
}

function getMergeArg(args: data): { [key: string]: string } {
   const result = {};
   args.join_vectors.forEach(vector => {
      const join_table = vector.join_table;
      const table = vector.table;

      result[join_table.parent_attach_key] = table.alias;
   })

   return result;
}

function getParentTableSelection(args: data): string {
   const table = args.main_table;
   const result = table.columns
      .map(col => `${table.alias}.${col} as ${table.alias}_${col}`)
      .join(', ')

   return result;
}

function getOtherTableSelection(args: data): any[] {
   const result = [];
   args.join_vectors.forEach(vector => {
      const table = vector.table;
      table.columns.forEach(column => {
         result.push(`${table.alias}.${column}`)
      })
   })

   return result;
}