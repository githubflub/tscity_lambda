import { getEntity } from 'lib/database/logic/getEntity'
import { listRooms } from 'lib/schema/thread/logic/list'
import { ChatSettings } from '../typedef'

export async function getChatSettings(identity) {
   const rooms = await listRooms();

   let primary_room;
   let startup_rooms = [];

   (rooms || []).forEach(room => {
      if (room.primary_room && !primary_room) {
         primary_room = room.id
      }

      if (room.startup_room) {
         startup_rooms.push(room.id)
      }
   })

   let chat_settings;
   if (identity.id) {
      chat_settings = await getEntity<ChatSettings>(ChatSettings.name, { user_id: identity.id })
      if (chat_settings) {
         console.log("retrieved chat_settings", chat_settings)
      }
      else {
         console.log("User doesn't have any custom chat settings. No worries!")
      }
   }

   const final_chat_settings = {
      primary_room,
      startup_rooms,
      startup_no_room: false,
      ...chat_settings,
   }
   console.log("final_chat_settings", final_chat_settings)
   return final_chat_settings
}