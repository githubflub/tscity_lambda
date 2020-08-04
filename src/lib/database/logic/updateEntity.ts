import { InstantiableEntity } from 'types/InstantiableEntity'
import { BaseEntity, FindConditions, FindOneOptions } from 'typeorm'

const defaultUpdateEntityOptions = {
   dont_create: false, // If entity doesn't exist, don't create it!
   authorizer: undefined,
}

export type UpdateEntityOptions = Partial<typeof defaultUpdateEntityOptions>

export async function updateEntity<OutputType extends BaseEntity, InputType>(
   EntityClass: InstantiableEntity<OutputType>,
   entity_data: InputType,
   findOne_query: FindConditions<OutputType>,
   options: UpdateEntityOptions = defaultUpdateEntityOptions
): Promise<OutputType> {

   console.log(`Updating a ${EntityClass.name} with this data:`)
   console.log(entity_data)

   const existing_entity = await EntityClass.findOne(findOne_query)
   console.log(`Existing ${EntityClass.name}`, existing_entity)
   if ((options.dont_create || options.authorizer) && !existing_entity) {
      console.log(`Options prevent continuing. Bailing. options:\n`, options)
      return new EntityClass(entity_data);
   }

   // If there is an authorizer, we are
   // guaranteed that the entity exists by
   // this point.
   if (options.authorizer) {
      // Authorize update
      let is_authorized = options.authorizer(existing_entity);
      if (!is_authorized) throw new Error('Access denied! You are not authorized to do that!')
   }

   const wtf = { ...existing_entity, ...entity_data }
   console.log("wtf", wtf)

   const new_entity = new EntityClass(wtf);
   // console.log("new_entity", new_entity)
   const updated_entity = await new_entity.save()

   console.log(`Updated this ${EntityClass.name}!\n`, JSON.stringify(updated_entity))

   return updated_entity
}