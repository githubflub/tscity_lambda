import { isNonNullType, isListType, isLeafType, isAbstractType, isObjectType, GraphQLError, locatedError, GraphQLLeafType } from "graphql";
import { Path, addPath, pathToArray } from "graphql/jsutils/Path";
import memoize3 from "graphql/jsutils/memoize3";
import { collectFields, executeFields } from './fakeql'

export const SYMBOL_ITERATOR =
   typeof Symbol === 'function' ? Symbol.iterator : '@@iterator';

// This is a small wrapper around completeValue which detects and logs errors
// in the execution context.
export async function completeValueCatchingError(
   exeContext,
   returnType,
   fieldNodes,
   info,
   path: Path,
   result,
   resolveFn,
 ) {
   try {
      let completed = await completeValue(
         exeContext,
         returnType,
         fieldNodes,
         info,
         path,
         result,
         resolveFn
      );

      // console.log("completeValueCatchingError result", completed);

      return completed;
   } catch (error) {
      return handleFieldError(error, fieldNodes, path, returnType, exeContext);
   }
}

async function completeValue(
   exeContext,
   returnType,
   fieldNodes,
   info,
   path,
   result,
   resolveFn
) {
   if (result instanceof Error) {
      throw result;
   }

   // If field type is NonNull, complete for inner type, and throw field error
   // if result is null.
   if (isNonNullType(returnType)) {
      // console.log("I am a non-null type for ", returnType.ofType);
      const completed = await completeValue(
         exeContext,
         returnType.ofType,
         fieldNodes,
         info,
         path,
         result,
         resolveFn
      );

      if (completed === null) {
         throw new Error(
            `Cannot return null for non-nullable field ${info.parentType.name}.${info.fieldName}.`,
         );
      }
      return completed;
   }

   // If result value is null or undefined then return null.
   if (result == null) {
      // console.log("I am an acceptable null");
      return null;
   }

   // If field type is List, complete each item in the list with the inner type
   if (isListType(returnType)) {
      // console.log("I am a list type!");
      return await completeListValue(
         exeContext,
         returnType,
         fieldNodes,
         info,
         path,
         result,
         resolveFn
      );
   }

   // If field type is a leaf type, Scalar or Enum, serialize to a valid value,
   // returning null if serialization is not possible.
   if (isLeafType(returnType)) {
      // console.log("I am a Leaf type, probably where numbers become strings", typeof result);
      // return result;
      return completeLeafValue(returnType, result);
   }

   // If field type is an abstract type, Interface or Union, determine the
   // runtime Object type and complete for that type.
   if (isAbstractType(returnType)) {
      // console.log("Wtf is an abstract type?", returnType);
      return await completeAbstractValue(
         exeContext,
         returnType,
         fieldNodes,
         info,
         path,
         result,
         resolveFn
      );
   }

   // If field type is Object, execute and complete all sub-selections.
   // istanbul ignore else (See: 'https://github.com/graphql/graphql-js/issues/2618')
   if (isObjectType(returnType)) {
      // console.log("I am an object")
      return await completeObjectValue(
         exeContext,
         returnType,
         fieldNodes,
         info,
         path,
         result,
         resolveFn
      );
   }

   // istanbul ignore next (Not reachable. All possible output types have been considered)
   throw new Error('Cannot complete value of unexpected output type: ' + returnType)
}

/**
 * Complete a value of an abstract type by determining the runtime object type
 * of that value, then complete the value for that type.
 */
async function completeAbstractValue(
   exeContext,
   returnType,
   fieldNodes,
   info,
   path: Path,
   result,
   resolveFn
) {
   const resolveTypeFn = returnType.resolveType || exeContext.typeResolver;
   const contextValue = exeContext.contextValue;
   const runtimeType = await resolveTypeFn(result, contextValue, info, returnType);

   return await completeObjectValue(
      exeContext,
      ensureValidRuntimeType(
         runtimeType,
         exeContext,
         returnType,
         fieldNodes,
         info,
         result,
      ),
      fieldNodes,
      info,
      path,
      result,
      resolveFn,
   );
}

function ensureValidRuntimeType(
   runtimeTypeOrName,
   exeContext,
   returnType,
   fieldNodes,
   info,
   result,
 ) {
   const runtimeType =
      typeof runtimeTypeOrName === 'string'
         ? exeContext.schema.getType(runtimeTypeOrName)
         : runtimeTypeOrName;

   if (!isObjectType(runtimeType)) {
      throw new GraphQLError(
         `Abstract type "${returnType.name}" must resolve to an Object type at runtime for field "${info.parentType.name}.${info.fieldName}" with ` +
            `value ${result}, received "${runtimeType}". ` +
            `Either the "${returnType.name}" type should provide a "resolveType" function or each possible type should provide an "isTypeOf" function.`,
         fieldNodes,
      );
   }

   if (!exeContext.schema.isSubType(returnType, runtimeType)) {
      throw new GraphQLError(
         `Runtime Object type "${runtimeType.name}" is not a possible type for "${returnType.name}".`,
         fieldNodes,
      );
   }

   return runtimeType;
}

/**
 * Complete an Object value by executing all sub-selections.
 */
async function completeObjectValue(
   exeContext,
   returnType,
   fieldNodes,
   info,
   path: Path,
   result,
   resolveFn
 ) {
   // If there is an isTypeOf predicate function, call it with the
   // current result. If isTypeOf returns false, then raise an error rather
   // than continuing execution.
   if (returnType.isTypeOf) {
      const isTypeOf = await returnType.isTypeOf(result, exeContext.contextValue, info);

      if (!isTypeOf) {
         throw invalidReturnTypeError(returnType, result, fieldNodes);
      }
   }

   return await collectAndExecuteSubfields(
      exeContext,
      returnType,
      fieldNodes,
      path,
      result,
      resolveFn
   );
}

async function collectAndExecuteSubfields(
   exeContext,
   returnType,
   fieldNodes,
   path: Path,
   result,
   resolveFn
) {
   // Collect sub-fields to execute to complete this value.
   const subFieldNodes = collectSubfields(exeContext, returnType, fieldNodes);
   return await executeFields(
      exeContext,
      returnType,
      result,
      path,
      subFieldNodes,
      resolveFn
   );
}

/**
 * A memoized collection of relevant subfields with regard to the return
 * type. Memoizing ensures the subfields are not repeatedly calculated, which
 * saves overhead when resolving lists of values.
 */
const collectSubfields = memoize3(_collectSubfields);
function _collectSubfields(
   exeContext,
   returnType,
   fieldNodes,
) {
   let subFieldNodes = Object.create(null);
   const visitedFragmentNames = Object.create(null);
   for (const node of fieldNodes) {
      if (node.selectionSet) {
         subFieldNodes = collectFields(
            exeContext,
            returnType,
            node.selectionSet,
            subFieldNodes,
            visitedFragmentNames,
         );
      }
   }
   return subFieldNodes;
}

/**
 * Complete a Scalar or Enum by serializing to a valid value, returning
 * null if serialization is not possible.
 */
function completeLeafValue(returnType: GraphQLLeafType, result) {
   const serializedResult = returnType.serialize(result);
   if (serializedResult === undefined) {
     throw new Error(
       `Expected a value of type "${returnType}" but ` +
         `received: ${result}`,
     );
   }
   return serializedResult;
 }


/**
 * Complete a list value by completing each item in the list with the
 * inner type
 */
async function completeListValue(
   exeContext,
   returnType,
   fieldNodes,
   info,
   path: Path,
   result,
   resolveFn
) {
   if (!isCollection(result)) {
      throw new GraphQLError(
         `Expected Iterable, but did not find one for field "${info.parentType.name}.${info.fieldName}".`,
      );
   }

   // This is specified as a simple map, however we're optimizing the path
   // where the list contains no Promises by avoiding creating another Promise.
   const itemType = returnType.ofType;
   let containsPromise = false;

   // const completedResults = await Array.from(result, async (item, index) => {
   //    // No need to modify the info object containing the path,
   //    // since from here on it is not ever accessed by resolver functions.
   //    await item
   //    const fieldPath = addPath(path, index);
   //    const completedItem = await completeValueCatchingError(
   //       exeContext,
   //       itemType,
   //       fieldNodes,
   //       info,
   //       fieldPath,
   //       item,
   //       resolveFn
   //    );

   //    return completedItem;
   // });

   const completedResults = [];
   for (let i = 0; i < result.length; i++) {
      const item = result[i];
      const fieldPath = addPath(path, i);
      const completedItem = await completeValueCatchingError(
         exeContext,
         itemType,
         fieldNodes,
         info,
         fieldPath,
         item,
         resolveFn
      );

      // console.log("completeListItem", completedItem);

      completedResults.push(completedItem);
   }

   // console.log("COMPLETED LIST RESULTS", completedResults)

   return completedResults;
 }



 function isCollection(obj): boolean {
  if (obj == null || typeof obj !== 'object') {
    return false;
  }

  // Is Array like?
  const length = obj.length;
  if (typeof length === 'number' && length >= 0 && length % 1 === 0) {
    return true;
  }

  // Is Iterable?
  return typeof obj[SYMBOL_ITERATOR] === 'function';
}

function handleFieldError(rawError, fieldNodes, path, returnType, exeContext) {
   const error = locatedError(
      asErrorInstance(rawError),
      fieldNodes,
      pathToArray(path),
   );

   // If the field type is non-nullable, then it is resolved without any
   // protection from errors, however it still properly locates the error.
   if (isNonNullType(returnType)) {
      throw error;
   }
   // Otherwise, error protection is applied, logging the error and resolving
   // a null value for this field if one is encountered.
   exeContext.errors.push(error);
   return null;
 }

// Sometimes a non-error is thrown, wrap it as an Error instance to ensure a
// consistent Error interface.
function asErrorInstance(error): Error {
   if (error instanceof Error) {
     return error;
   }
   return new Error('Unexpected error value: ' + error);
}

function invalidReturnTypeError(
   returnType,
   result,
   fieldNodes,
): GraphQLError {
   return new GraphQLError(
      `Expected value of type "${returnType.name}" but got: ${result}.`,
      fieldNodes,
   );
}