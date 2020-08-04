import {
   getConnection,
   FindOneOptions,
   ObjectID,
   FindConditions,
   BaseEntity
} from 'typeorm'

// findOneOrFail - Finds the first entity that matches the some id or find options.
// Rejects the returned promise if nothing matches.
const defaultOptions = {
   fail_if_not_found: false
}

export type GetOptionsType = Partial<typeof defaultOptions>

export async function getEntity<ClassType>(
   entity_name: string,
   id_or_query: FindConditions<ClassType> | string | number | Date | ObjectID | FindOneOptions<ClassType>,
   options: GetOptionsType = defaultOptions
): Promise<ClassType> {
   console.log('TYPEORM GET:', id_or_query)
   const EntityRepository = getConnection().getRepository<ClassType>(entity_name);
   let entity;
   if (options.fail_if_not_found) {
      entity = await EntityRepository.findOneOrFail(id_or_query)
   }
   else {
      entity = await EntityRepository.findOne(id_or_query)
   }
   console.log(`Found ${entity_name}`);
   console.log(JSON.stringify(entity, null, 2))

   return entity;
}