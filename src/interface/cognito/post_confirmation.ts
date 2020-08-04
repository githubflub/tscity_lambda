
import { allocateResourcesForNewUser } from '../../lib/allocateResourcesForNewUser'

export async function handler(event, context, callback) {
   console.log('event:', JSON.stringify(event))

   // This is so I can be lazy and not close my database connection?
   context.callbackWaitsForEmptyEventLoop = false;

   if (event.triggerSource === 'PostConfirmation_ConfirmSignUp') {
      try {
         const request = {
            body: {
               username: event.userName,
               sub: event.request.userAttributes.sub,
               email: event.request.userAttributes.email,
               email_verified: event.request.userAttributes.email_verified === 'true'? true : false,
               phone: event.request.userAttributes.phone,
               phone_verified: event.request.userAttributes.phone_verified === 'true'? true : false,
               created_by: event.userName,
               updated_by: event.userName,
            }
         }

         const result = await allocateResourcesForNewUser(request)
         console.log('RESULT allocateResourcesForNewUser:', JSON.stringify(result))
         callback(null, event)
      }
      catch(error) {
         console.log('error', error)
         callback(null, event)
      }
   }
   else {
      console.log('triggerSource is not PostConfirmation_ConfirmSignUp, so not doing anything here.')
      callback(null, event);
   }
}
