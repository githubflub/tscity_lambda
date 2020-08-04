import { ThreadSilence } from 'lib/schema/ThreadSilence/typedef';

export async function createThreadSilence(thread_silence_data) {

   console.log("Creating a thread with this data:")
   console.log(JSON.stringify(thread_silence_data, null, 2))

   const new_thread_silence = new ThreadSilence(thread_silence_data);
   const created_thread_silence = await new_thread_silence.save()

   console.log("Created this ThreadSilence!\n", JSON.stringify(created_thread_silence))

   return created_thread_silence
}