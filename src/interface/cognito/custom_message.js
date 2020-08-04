
import { customizeMessage } from '../../lib/email/cognito/customizeMessage.js'

export async function handler(event, context, callback) {
   console.log('event:', JSON.stringify(event))

   try {
      const customized_event = await customizeMessage(event)
      console.log('customized event:', JSON.stringify(customized_event))
      callback(null, customized_event)
   }
   catch(error) {
      console.log('error', error)
      callback(null, event)
   }
}
