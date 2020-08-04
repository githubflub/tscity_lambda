import 'reflect-metadata'
import { ApolloServer } from 'apollo-server-lambda'
import { createSchema } from 'lib/schema/createSchema'
import { connectToDatabase } from 'lib/database/connectToDatabase'
import { setGraphQlContext } from './setGraphQlContext';

const createHandler = async () => {

   const graphql_schema = await createSchema();

   // If you make this in here, you'll have to make it every
   // time the lambda runs. Later on, see if you can move this out
   // of the handler.
   const server = new ApolloServer({
      schema: graphql_schema,
      context: setGraphQlContext,
      introspection: true,
   })

   return server.createHandler({
      cors: { origin: '*' }
   })
}

export function handler(event, context, callback) {
   console.log('http event:', JSON.stringify(event))
   // console.log('New http event!')

   connectToDatabase()
      .then(database_connection => {
         return createHandler()
      })
      .then(handler => {
         return handler(event, context, callback)
      })
      .catch(error => {
         console.log("error", error)
         callback(null, error)
      })
}