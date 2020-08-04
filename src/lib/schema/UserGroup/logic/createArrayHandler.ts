import { IdentityType } from 'types/Identity'

type AllowedFunction<InputType> = (arg_1: IdentityType, arg_2: InputType) => Promise<InputType>

export const createArrayHandler = <InputType>(func: AllowedFunction<InputType>) => async (
   identity: IdentityType,
   input: InputType | InputType[],
): Promise<InputType | InputType[]> => {

   let result = input;
   if (Array.isArray(input)) {
      const promises = input.map(item => func(identity, item));
      result = await Promise.all(promises);
   }
   else {
      result = await func(identity, input);
   }

   return result;
}