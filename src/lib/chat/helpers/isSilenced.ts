import { getEntity } from 'lib/database/logic/getEntity'
import { FindConditions } from 'typeorm'
import { ThreadSilence } from 'lib/schema/ThreadSilence/typedef'

// You must be connected to the database to use this function!!
export async function isSilenced(identity, body) {
   const query: FindConditions<ThreadSilence> = {
      user_id: identity['id'],
      thread_id: body.payload.thread_id
   }

   // const global_silences = await
   const thread_silence = await getEntity<ThreadSilence>(ThreadSilence.name, query)
   // thread_silence will be undefined if there's no matching row the table
   // return false; used for testing
   if (thread_silence) {
      console.log('thread_silence', typeof thread_silence.expires, thread_silence.expires)

      // check expiration
      if (!thread_silence.expires) {
         // null expires is a perma silence!
         return true;
      }
      else if (Date.now() < Date.parse(thread_silence.expires.toISOString())) {
         // silence hasn't expired yet!
         return true;
      }
      else {
         // user isn't silenced, so maybe I should delete row?
      }
   }

   return false
}