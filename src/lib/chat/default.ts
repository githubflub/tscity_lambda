import { disconnectClientFromChat } from './disconnect';
import { sendMessage } from './sendMessage'
import { joinRooms } from './joinRooms'
import { leaveRooms } from './leaveRooms'
import { keepAlive } from './keepAlive'


export async function processDefaultAction(event) {

   let body: { action?: string } = {};
   try {
      body = JSON.parse(event.body)
   }
   catch (error) {
      console.log('ERROR: Body is not JSON parseable!!')
      throw error;
   }

   // Only allow action === 'send'
   switch (body.action) {
      case 'send':
         return await sendMessage(event, body);
      case 'joinrooms':
         return await joinRooms(event, body);
      case 'leaverooms':
         return await leaveRooms(event, body);
      case 'keepalive':
         return await keepAlive(event, body);
      default:
         return await disconnectClientFromChat(event)
   }
}

