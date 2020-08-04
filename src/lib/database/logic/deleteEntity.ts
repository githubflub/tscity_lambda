import { InstantiableEntity } from 'types/InstantiableEntity'
import { BaseEntity } from 'typeorm'

// assumes you're already connected to the database
export async function deleteEntity<OutputType extends BaseEntity, InputType>(
   EntityClass: InstantiableEntity<OutputType>,
   entity_data: InputType,
   authorizer?: Function
): Promise<OutputType> {
   console.log(`Deleting a ${EntityClass.name} with this data:`)
   console.log(JSON.stringify(entity_data, null, 2))

   const entity = await EntityClass.findOne(entity_data);
   console.log(`Found this ${EntityClass.name} entity\n`, JSON.stringify(entity));
   if (entity) {
      // Authorize removal.
      let is_authorized = false;
      if (authorizer) {
         is_authorized = authorizer(entity);
      }
      else {
         is_authorized = true;
      }

      if (is_authorized) await entity.remove();
      else {
         throw new Error('Access denied! You are not authorized to do that!')
      }
   }

   // console.log(`Entity data after removal of ${EntityClass.name}:`)
   // console.log(JSON.stringify(entity_data, null, 2))

   // This is really strange. id disappears if I put
   // ...entity_data first. TypeORM doesn't return the id
   // of deleted entities...
   const deleted_entity = { ...(entity || new EntityClass(entity_data)), ...entity_data };

   console.log(`Deleted this ${EntityClass.name}!\n`, JSON.stringify(deleted_entity))
   return deleted_entity
}