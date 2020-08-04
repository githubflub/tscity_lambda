import { InstantiableEntity } from 'types/InstantiableEntity'
import { BaseEntity } from 'typeorm'

// TypeORM won't return an id, so
// we can't just "block". We have to fail.
const DEFAULT_CREATE_ENTITY_OPTIONS = {
   fail_if_exists: false,
   update_if_exists: false,
}

export type CreateEntityOptionsType = Partial<typeof DEFAULT_CREATE_ENTITY_OPTIONS>;

// assumes you're already connected to the database
// Will update if necessary (assuming no auto-generated primary key)
export async function createEntity<OutputType extends BaseEntity, InputType>(
   EntityClass: InstantiableEntity<OutputType>,
   entity_data: InputType,
   options: CreateEntityOptionsType = DEFAULT_CREATE_ENTITY_OPTIONS
): Promise<OutputType> {

   console.log(`Creating a ${EntityClass.name} with this data:`)
   console.log(JSON.stringify(entity_data, null, 2))

   const should_check_existence = options.fail_if_exists || options.update_if_exists
   if (should_check_existence) {
      const find_result = await EntityClass.findOne(entity_data);

      if (find_result) {
         if (options.fail_if_exists) {
            const error_message = `${EntityClass.name} already exists. Not creating a new one.`
            console.log(error_message)
            throw new Error(error_message)
         }
         else if (options.update_if_exists) {
            entity_data = { ...find_result, ...entity_data }
            console.log(`Updated ${EntityClass.name}'s entity_data:`)
            console.log(JSON.stringify(entity_data, null, 2))
         }
      }
   }

   const new_entity = new EntityClass(entity_data);
   const created_entity = await new_entity.save()

   console.log(`Created this ${EntityClass.name}!\n`, JSON.stringify(created_entity))

   return created_entity
}