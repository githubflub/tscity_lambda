import { createMethodDecorator } from "type-graphql";
import { authorizeAccess } from '../authorizers/authorizeAccess';
import { GraphQLContext } from 'interface/graphql/setGraphQlContext'

// I believe this ONLY controls who can read fields.
// Meaning this does NOT control who can write fields.
// However, I have to verify this...

export function FieldAuthGuard(roles: string | string[] = []): MethodDecorator | any {
   return createMethodDecorator<GraphQLContext>(async (params, next) => {
      const result = await next();

      const requester_identity = params.context.requester_identity;

      const allowed_roles = typeof roles === 'string'? [roles] : roles;
      const field_parent = params.root;

      if (!authorizeAccess(field_parent, requester_identity, allowed_roles, 'Field')) {
         return null;
      }

      return result;
   })
}