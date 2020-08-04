import { Iot } from 'aws-sdk'
const TS_AWS_REGION = process.env.TS_AWS_REGION;
export async function attachIoTPolicy(identity, identity_id) {
   const iot_client = new Iot({ region: TS_AWS_REGION })
   console.log('INFO attachIoTPolicy identity_id', identity_id);
   let result;
   try {
      result = await iot_client.attachPrincipalPolicy({
         policyName: 'tscity_iot_user_scoped_policy',
         principal: identity_id,
      }).promise();

      console.log(`SUCCESS - attached principal policy for ${identity['cognito:username']}`)
      return 'SUCCESS'
   }
   catch (error) {
      console.log("ERROR - attachIoTPolicy", error);
      throw new Error('FAIL');
   }
}