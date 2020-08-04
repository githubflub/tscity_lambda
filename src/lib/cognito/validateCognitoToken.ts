import { getCognitoPublicKeys } from 'lib/cognito/getCognitoPublicKeys'
import { promisify } from 'util'
import jsonwebtoken from 'jsonwebtoken'

import { connectToDatabase } from 'lib/database/connectToDatabase'
import { getUser } from 'lib/schema/user/logic/get'
import { CustomAuthorizerResult } from 'aws-lambda'

const TS_AWS_REGION = process.env.TS_AWS_REGION
const USER_POOL_ID = process.env.USER_POOL_ID
const verifyPromised = promisify(jsonwebtoken.verify.bind(jsonwebtoken));

export async function validateCognitoToken(request) {
   const {
      body: {
         token,
         methodArn,
         graphql_endpoint,
      }
   } = request

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

   try {
      if (!TS_AWS_REGION || !USER_POOL_ID) {
         throw new Error('Missing cognito environment variables...');
      }

      const COGNITO_ISSUER_URL = `https://cognito-idp.${TS_AWS_REGION}.amazonaws.com/${USER_POOL_ID}`

      const token_sections = (token || '').split('.')
      if (token_sections.length < 2) {
         throw new Error('token is invalid')
      }

      const header_json_string = Buffer.from(token_sections[0], 'base64').toString('utf8')
      const header = JSON.parse(header_json_string)

      const keys = await getCognitoPublicKeys();
      const key = keys[header.kid];
      if (key === undefined) {
         throw new Error('claim made for unknown key id')
      }

      const claim = await verifyPromised(token, key.pem);
      const current_seconds = Math.floor((new Date()).valueOf() / 1000);
      console.log("CLAIM:")
      console.log(claim)
      if (current_seconds > claim.exp || current_seconds < claim.auth_time) {
         throw new Error('claim expired or otherwise invalid');
      }
      if (claim.iss !== COGNITO_ISSUER_URL) {
         throw new Error('claim issuer is invalid')
      }
      if (claim.token_use !== 'id') {
         throw new Error('claim use is not id');
      }

      console.log(`claim confirmed for ${claim['cognito:username']}`);
      let user = undefined;
      if (!!claim['cognito:username']) {
         if (!graphql_endpoint) {
            // If this breaks while using serverless offline,
            // run sls offline with --noAuth
            await connectToDatabase();
            user = await getUser({ username: claim['cognito:username'] })
         }
         auth_response.principalId = claim['cognito:username']
      }

      const identity = {
         ...user,
         ...claim,
      }

      // Base64 encode this to avoid pain and suffering...
      // The context object only really works with string values
      // on its properties.
      auth_response.context = {
         identity: Buffer.from(JSON.stringify(identity)).toString('base64'),
      }
   }
   catch (error) {
      console.log('ERROR: validateCognitoToken - ', error)
   }

   return auth_response;
}