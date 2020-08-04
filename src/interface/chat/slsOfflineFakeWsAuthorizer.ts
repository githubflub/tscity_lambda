import { handler as customAuthorizer } from '../custom_authorizer'
import { CustomAuthorizerResult } from 'aws-lambda'

export async function slsOfflineFakeWsAuthorizer(event) {
   console.log("Running slsOfflineFakeWsAuthorizer");
   if (!event.methodArn) {
      event.methodArn = 'doesnt_matter'
   }

   try {
      const auth_result: CustomAuthorizerResult = await new Promise((resolve, reject) => {
         customAuthorizer(event, {}, (error, result) => {
            if (error) {
               reject(error);
            }
            else {
               resolve(result);
            }
         })
      })

      event.requestContext.authorizer = auth_result.context;
   }
   catch (error) {
      console.error("ERROR: slsOfflineFakeWsAuthorizer", error);
   }
}