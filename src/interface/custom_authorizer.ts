import { validateCognitoToken } from 'lib/cognito/validateCognitoToken'

export async function handler2(event, context, callback) {
   console.log('Custom authorizer event:', event)
   const {
      methodArn,
      queryStringParameters: { token } = { token: 'lurkertoken' },
      authorizationToken,
   } = event;

   const request = {
      body: {
         token: authorizationToken || token,
         methodArn,
         graphql_endpoint: !!authorizationToken,
      }
   }

   // This is so I can be lazy and not close my database connection?
   context.callbackWaitsForEmptyEventLoop = false;

   try {
      const result = await validateCognitoToken(request)
      console.log('RESULT: validateCognitoToken result - ', result)
      callback(null, result)
   }
   catch (error) {
      console.log("ERROR: custom_authorizer", error)
      callback('Unauthorized')
   }
}

export function handler(event, context, callback) {
   Promise.resolve()
      .then(nothing => {
         return handler2(event, context, callback)
      })

}
