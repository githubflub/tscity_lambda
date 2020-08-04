import { getUser } from "lib/schema/user/logic/get";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { IdentityType } from 'types/Identity'

export interface GraphQLContext extends Context {
   requester_identity: IdentityType
}

export async function setGraphQlContext({ event, context }: { event: APIGatewayProxyEvent, context: Context }): Promise<GraphQLContext> {
   const new_context: GraphQLContext = {
      ...context,
      requester_identity: {}
   }

   // If you didn't do DB call in custom authorizer
   if (event.requestContext.authorizer && event.requestContext.authorizer.identity) {
      const identity = JSON.parse(Buffer.from(event.requestContext.authorizer.identity, 'base64').toString())

      if (identity['cognito:username']) {
         const user = await getUser({ username: identity['cognito:username'] })
         Object.assign(identity, user);
      }

      new_context.requester_identity = identity
   }

   // // If you did do DB call in custom authorizer
   // if ((event.requestContext || {}).authorizer || {}) {
   //    const identity = event.requestContext.authorizer
   //    // delete identity.claims; // redundant data
   //    new_context.requester_identity = identity
   // }

   // console.log("final context", JSON.stringify(new_context, null, 2))

   return new_context;
}