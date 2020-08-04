import { InstantiableEntity } from 'types/InstantiableEntity'
import { BaseEntity, FindManyOptions } from 'typeorm'

export async function listEntity<OutputType extends BaseEntity>(
   EntityClass: InstantiableEntity<OutputType>,
   query: FindManyOptions<OutputType>,
) {
   const entities = await EntityClass.find(query);
   console.log("listEntity result", entities);
   return entities;
}