import { createUnionType } from 'type-graphql'
import { Message } from '../message/typedef'
import { SystemMessage } from '../MessageSystem/typedef'

export const MessageUnion = createUnionType({
   name: 'MessageUnion',
   types: [Message, SystemMessage],
   resolveType: value => {
      if ('system_message' in value) {
         return 'SystemMessage';
      }
      else {
         return 'Message';
      }
   }
})