import { CustomAuthorizerResult } from 'aws-lambda'
import { trackUserIpAddress } from 'lib/cognito/trackUserIpAddress';
import { validateCognitoToken } from 'lib/cognito/validateCognitoToken'
import { connectToDatabase } from 'lib/database/connectToDatabase';
import { getUser } from 'lib/schema/user/logic/get'
import { User } from 'lib/schema/user/typedef';

export async function handler2(event, context, callback) {
   console.log('Custom authorizer event:', JSON.stringify(event))
   const {
      methodArn,
      queryStringParameters: { token } = { token: 'lurkertoken' },
      authorizationToken,
   } = event;

   // This custom authorizor function is used by my
   // websocket endpoint and my http endpoint.
   // serverless-offline issues make it important to know
   // which endpoint i'm currently authorizing.
   const is_authorizing_for_websocket = !!authorizationToken;

   // This is so I can be lazy and not close my database connection?
   context.callbackWaitsForEmptyEventLoop = false;

   try {
      const auth_response: CustomAuthorizerResult = {
         principalId: "lurker",
         policyDocument: {
            Version: '2012-10-17',
            Statement: [
               {
                  "Action": "execute-api:Invoke",
                  "Effect": "Allow",
                  "Resource": methodArn,
               }
            ]
         }
      };

      const user_data = await validateCognitoToken(authorizationToken || token)
      console.log('RESULT: validateCognitoToken')
      console.log(JSON.stringify(user_data));

      let user
      if (!!user_data?.["cognito:username"]) {
         if (is_authorizing_for_websocket) {
            // This should only run for websocket endpoints.
            //
            // If this breaks while using serverless offline,
            // run sls offline with --noAuth
            await connectToDatabase()
            user = await getUser({ username: user_data['cognito:username'] })
            console.log("user is instance of User?", user instanceof User)
            await trackUserIpAddress(event, user)
         }
         auth_response.principalId = user_data['cognito:username']
      }

      const identity = {
         ...user,
         ...user_data
      }

      // Base64 encode this to avoid pain and suffering...
      // The context object only really works with string values
      // on its properties.
      auth_response.context = {
         identity: Buffer
            .from(JSON.stringify(identity))
            .toString('base64'),
      }

      callback(null, auth_response)
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
