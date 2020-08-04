import { authorizeAccess } from '../authorizers/authorizeAccess';
import { createMethodDecorator } from "type-graphql";
import { GraphQLContext } from 'interface/graphql/setGraphQlContext'

export function ResolverAuthGuard(roles: string | string[] = []) {
   return createMethodDecorator<GraphQLContext>((params, next) => {
      const {
         args,
         context,
      } = params

      let allowed_roles = typeof roles === 'string'? [roles] : roles;

      if (!authorizeAccess(args, context.requester_identity, allowed_roles, 'Resolver')) {
         throw new Error('Access denied! You are not authorized to do that!')
      }

      return next();
   })
}