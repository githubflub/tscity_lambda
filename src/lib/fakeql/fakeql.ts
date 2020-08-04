import {
   GraphQLSchema,
   DocumentNode,
   OperationDefinitionNode,
   FragmentDefinitionNode,
   Kind,
   GraphQLError,
   getOperationRootType,
   FieldNode,
   InlineFragmentNode,
   GraphQLObjectType,
   typeFromAST,
   isAbstractType,
   isNonNullType,
   locatedError,
   defaultTypeResolver,
} from "graphql";
import { Path, addPath, pathToArray } from "graphql/jsutils/Path";
import { getFieldDef, buildResolveInfo } from "graphql/execution/execute";
import { completeValueCatchingError } from './completeValue'
import { filter } from "graphql-anywhere";

const resolver = (source, args, contextValue, info) => {
   const fieldName = info.fieldName;

   // console.log("In my custom resolver!!!");
   // console.log(JSON.stringify(info.parentType));
   // console.log(info.returnType);
   // console.log(info.fieldName);
   // console.log(source);

   if (fieldName === '__typename' && !source[fieldName]) {
     return info.parentType
   }

   if (isObjectLike(source) || typeof source === 'function') {
     const property = source[info.fieldName];
     if (typeof property === 'function') {
       return source[info.fieldName](args, contextValue, info);
     }
     return property;
   }
}

type ExecutionArgsType = {
   schema: GraphQLSchema,
   document: DocumentNode,
   rootValue?: any,
   fieldResolver?: (...args) => any,
   typeResolver?: typeof defaultTypeResolver,
   operationName?: string; // Idk what this is for.
}
async function execute(args: ExecutionArgsType) {
   const {
      schema,
      document,
      rootValue,
      fieldResolver = resolver,
   } = args;

   if (!schema) {
      return filter(document, rootValue);
   }

   const exeContext = buildExecutionContext(args)

   const data = await executeOperation(
      exeContext,
      exeContext.operation,
      rootValue,
      fieldResolver
   )

   return buildResponse(exeContext, data);
}

/**
 * Given a completed execution context and data, build the { errors, data }
 * response defined by the "Response" section of the GraphQL specification.
 */
function buildResponse(
   exeContext,
   data,
) {
   return (exeContext.errors || []).length === 0
      ? { data }
      : { errors: exeContext.errors, data };
}

export type ExecutionContextType = {
   schema: GraphQLSchema;
   fragments: { [key: string]: FragmentDefinitionNode };
   rootValue: any;
   operation: OperationDefinitionNode;
   fieldResolver: (...args) => any;
   typeResolver: typeof defaultTypeResolver;
}

function buildExecutionContext({
   schema,
   document,
   rootValue,
   fieldResolver,
   operationName,
}: ExecutionArgsType): ExecutionContextType {
   let operation: OperationDefinitionNode | void;
   const fragments: { [key: string]: FragmentDefinitionNode } = Object.create(null);
   for (const definition of document.definitions) {
     switch (definition.kind) {
       case Kind.OPERATION_DEFINITION:
         if (operationName == null) {
           if (operation !== undefined) {
               throw new GraphQLError(
                 'Must provide operation name if query contains multiple operations.',
               )
           }
           operation = definition;
         } else if ((definition.name || {}).value === operationName) {
           operation = definition;
         }
         break;
       case Kind.FRAGMENT_DEFINITION:
         fragments[definition.name.value] = definition;
         break;
     }
   }

   if (!operation) {
      if (operationName != null) {
        throw new GraphQLError(`Unknown operation named "${operationName}".`);
      }
      throw new GraphQLError('Must provide an operation.');
   }

   return {
      schema,
      fragments,
      rootValue,
      operation,
      fieldResolver,
      typeResolver: defaultTypeResolver,
    };
}

async function executeOperation(
   exeContext: ExecutionContextType,
   operation: OperationDefinitionNode,
   rootValue: any,
   fieldResolver,
) {
   const type = getOperationRootType(exeContext.schema, operation);
   const fields = collectFields(
      exeContext,
      type,
      operation.selectionSet,
      Object.create(null),
      Object.create(null)
   )

   // console.log("What are these fields?");
   // console.log(fields);

   const path = undefined;

   try {
      const result =
         operation.operation === 'mutation'
            ? await executeFieldsSerially(
               exeContext,
               type,
               rootValue,
               path,
               fields,
               fieldResolver
            )
            : null;

      // console.log("executeSerially result", result);

      return result;
   } catch (error) {
      // console.log("BIG ERROR executeOperation", error);
      return null;
   }
}

async function executeFieldsSerially(
   exeContext,
   parentType,
   sourceValue, // THis is rootValue
   path,
   fields,
   fieldResolver,
) {
   const outer_result = await Object.keys(fields).reduce(async (sum, current) => {
      const reducer_result = await (async function (results, responseName) {
         const fieldNodes = fields[responseName]
         const fieldPath = addPath(path, responseName);
         const result = await resolveField(
            exeContext,
            parentType,
            sourceValue,
            fieldNodes,
            fieldPath,
            fieldResolver,
         )
         // console.log("inner_results", result);
         results[responseName] = result;
         return results;
      })(await sum, current)

      // console.log("reducer result", reducer_result);
      return reducer_result;
   }, Object.create(null))

   return outer_result;
}

async function resolveField(
   exeContext,
   parentType,
   source: any,
   fieldNodes,
   path: Path,
   fieldResolver,
) {
   const fieldNode = fieldNodes[0];
   const fieldName = fieldNode.name.value;

   const fieldDef = getFieldDef(exeContext.schema, parentType, fieldName);
   // console.log("fieldDef", fieldDef)
   if (!fieldDef) return;

   const resolveFn = fieldResolver;

   const info = buildResolveInfo(
      exeContext,
      fieldDef,
      fieldNodes,
      parentType,
      path,
   )

   const result = await resolveFieldValueOrError(
      exeContext,
      fieldDef,
      fieldNodes,
      resolveFn,
      source,
      info
   )

   return await completeValueCatchingError(
      exeContext,
      fieldDef.type,
      fieldNodes,
      info,
      path,
      result,
      resolveFn,
   )
}


// Sometimes a non-error is thrown, wrap it as an Error instance to ensure a
// consistent Error interface.
function asErrorInstance(error): Error {
   if (error instanceof Error) {
     return error;
   }
   return new Error('Unexpected error value: ' + error);
}

function getFieldEntryKey(node: FieldNode): string {
   return node.alias ? node.alias.value : node.name.value;
}

function doesFragmentConditionMatch(
   exeContext: ExecutionContextType,
   fragment: FragmentDefinitionNode | InlineFragmentNode,
   type: GraphQLObjectType,
 ): boolean {
   const typeConditionNode = fragment.typeCondition;
   if (!typeConditionNode) {
     return true;
   }
   const conditionalType = typeFromAST(exeContext.schema, typeConditionNode);
   if (conditionalType === type) {
     return true;
   }
   if (isAbstractType(conditionalType)) {
     return exeContext.schema.isSubType(conditionalType, type);
   }
   return false;
 }

export function collectFields(
   exeContext,
   runtimeType,
   selectionSet,
   fields,
   visitedFragmentNames,
) {
   for (const selection of selectionSet.selections) {
      switch (selection.kind) {
        case Kind.FIELD: {
          const name = getFieldEntryKey(selection);
          if (!fields[name]) {
            fields[name] = [];
          }
          fields[name].push(selection);
          break;
        }
        case Kind.INLINE_FRAGMENT: {
          if (!doesFragmentConditionMatch(exeContext, selection, runtimeType)) {
            continue;
          }
          collectFields(
            exeContext,
            runtimeType,
            selection.selectionSet,
            fields,
            visitedFragmentNames,
          );
          break;
        }
        case Kind.FRAGMENT_SPREAD: {
          const fragName = selection.name.value;
          if (visitedFragmentNames[fragName]) {
            continue;
          }
          visitedFragmentNames[fragName] = true;
          const fragment = exeContext.fragments[fragName];
          if (
            !fragment ||
            !doesFragmentConditionMatch(exeContext, fragment, runtimeType)
          ) {
            continue;
          }
          collectFields(
            exeContext,
            runtimeType,
            fragment.selectionSet,
            fields,
            visitedFragmentNames,
          );
          break;
        }
      }
    }


    return fields;
}

/**
 * Implements the "Evaluating selection sets" section of the spec
 * for "read" mode.
 */
export async function executeFields(
   exeContext,
   parentType,
   sourceValue,
   path,
   fields,
   resolveFn
 ) {
   const results = Object.create(null);
   let containsPromise = false;

   for (const responseName of Object.keys(fields)) {
      const fieldNodes = fields[responseName];
      const fieldPath = addPath(path, responseName);
      const result = await resolveField(
         exeContext,
         parentType,
         sourceValue,
         fieldNodes,
         fieldPath,
         resolveFn
      );

      if (result !== undefined) {
         results[responseName] = result;
      }
   }

   // If there are no promises, we can just return the object
   return results;
}

/**
 * Isolates the "ReturnOrAbrupt" behavior to not de-opt the `resolveField`
 * function. Returns the result of resolveFn or the abrupt-return Error object.
 *
 * @internal
 */
export async function resolveFieldValueOrError(
   exeContext,
   fieldDef,
   fieldNodes,
   resolveFn,
   source,
   info,
) {
   try {
      const args = {}

      // The resolve function's optional third argument is a context value that
      // is provided to every resolve function within an execution. It is commonly
      // used to represent an authenticated user, or request-specific caches.
      const contextValue = exeContext.contextValue;

      const result = await resolveFn(source, args, contextValue, info);
      return result;
   } catch (error) {
      return asErrorInstance(error);
   }
}

export function isObjectLike(value) {
   return typeof value == 'object' && value !== null;
}

export const fakeql = {
   execute,
}