import { ChatConnection } from 'lib/schema/chat_connection/typedef'
import { FindManyOptions, FindConditions } from 'typeorm';

export async function listChatConnections(query?: FindConditions<ChatConnection>) {
   const chat_connections = await ChatConnection.find(query);
   console.log("YOUR CHAT CONNECTIONS", chat_connections);
   return chat_connections;
}