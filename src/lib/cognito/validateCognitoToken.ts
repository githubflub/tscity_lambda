import { getCognitoPublicKeys } from 'lib/cognito/getCognitoPublicKeys'
import { promisify } from 'util'
import jsonwebtoken from 'jsonwebtoken'

const TS_AWS_REGION = process.env.TS_AWS_REGION
const USER_POOL_ID = process.env.USER_POOL_ID
const verifyPromised = promisify(jsonwebtoken.verify.bind(jsonwebtoken));

export async function validateCognitoToken(token) {
   let claim

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
   }
   catch (error) {
      console.log('ERROR: validateCognitoToken - ', error)
   }

   return claim
}