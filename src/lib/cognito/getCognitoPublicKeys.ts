import axios from 'axios'
const jwkToPem = require('jwk-to-pem');

const TS_AWS_REGION = process.env.TS_AWS_REGION
const USER_POOL_ID = process.env.USER_POOL_ID

export async function getCognitoPublicKeys() {
   if (!global.cognito_public_keys) {
      if (!TS_AWS_REGION || !USER_POOL_ID) {
         throw new Error('Missing cognito environment variables...');
      }

      const COGNITO_ISSUER_URL = `https://cognito-idp.${TS_AWS_REGION}.amazonaws.com/${USER_POOL_ID}`
      const PUBLIC_KEYS_URL = `${COGNITO_ISSUER_URL}/.well-known/jwks.json`
      const cognito_public_keys = await axios.get(PUBLIC_KEYS_URL);


      global.cognito_public_keys = cognito_public_keys.data.keys.reduce((agg, current) => {
         const pem = jwkToPem(current)
         agg[current.kid] = { instance: current, pem }
         return agg;
      }, {})
   }

   return global.cognito_public_keys;
}