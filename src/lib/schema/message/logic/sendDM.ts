import { IdentityType } from "types/Identity";
import { ListManyToManyOptions } from 'lib/database/logic/createManyToManyEntityLister'
import { listThreads } from "lib/schema/thread/logic/list";
import { createThread } from "lib/schema/thread/logic/create";
import { createMessage } from "./create";
import { validateMessage } from '@tscity/shared/utils/validateMessage'
import IotData from 'lib/iot/iotdata'
import { getUser } from "lib/schema/user/logic/get";
import { IoTSubtopics } from "@tscity/shared/iot/subtopics";
import { SEND_DM } from '@tscity/shared/graphql/mutation/SEND_DM'
import { fakeql } from 'lib/fakeql/fakeql'
import { withBlockGate } from 'lib/schema/Block/logic/withBlockGate'
import { MessageSenderGroup } from "lib/schema/MessageSenderGroup/typedef";

export async function sendDM(
   identity: IdentityType,
   target_user_id: number,
   content: string
) {
   console.log("target_user_id", target_user_id)
   console.log("content", content)
   const is_messaging_themselves = identity.id === target_user_id;

   let target_user;
   try {
      target_user = is_messaging_themselves
         ? identity
         : await getUser({ id: target_user_id });
   }
   catch (error) {
      throw new Error('Could not send your message. Unknown target user.');
   }

   const thread_query: ListManyToManyOptions = {
      take: 1,
      where: (`
         t.is_dm = TRUE and t.id in (
            select tua.thread_id
            from thread_user_access tua
            inner join user u on tua.user_id = u.id
            where u.id = :self_id
         ) and t.id in (
            select tua.thread_id
            from thread_user_access tua
            inner join user u on tua.user_id = u.id
            where u.id = :target_user_id
         )
      `),
      params: { self_id: identity.id, target_user_id }
   }

   if (is_messaging_themselves) {
      thread_query.having = 'COUNT(DISTINCT u.id) = 1'
   }

   const find_thread_result = await listThreads(thread_query);

   let thread;
   if (!find_thread_result.length) {
      thread = await createThread({
         is_dm: true,
         access_users: [identity.id, target_user_id],
      })
   }
   else {
      thread = find_thread_result[0];
   }

   try {
      const message = validateMessage(content);
      let sender_groups = [];
      for (let i = 0; i < (identity.groups || []).length; i++) {
         const group = identity.groups?.[i]
         if (group) {
            const sender_group = new MessageSenderGroup({
               context: group.context,
               context_id: group.context_id,
               group: group.group,
               user_id: group.user_id
            })

            await sender_group.save()
            sender_groups.push(sender_group)
         }
      }
      const new_message = await createMessage({
         sender_id: identity.id,
         sender_username: identity['cognito:username'],
         sender_display_name: identity.display_name,
         sender_groups,
         sender: {
            id: identity.id,
            username: identity['cognito:username'],
            display_name: identity.display_name,
            groups: identity.groups // This needs to be thread specific
         },
         origin_thread_id: thread.id,
         thread_id: thread.id,
         content: message,
         threads: [thread],
      })

      const result = {
         thread: {
            ...thread,
            users: is_messaging_themselves
               ? [identity]
               : [identity,target_user]
         },
         message: new_message
      }

      // Publish message to target.
      await withBlockGate(
         identity,
         'send a DM to',
         target_user,
         async () => {
            const filtered_result = await fakeql.execute({
               schema: global.schema,
               document: SEND_DM,
               rootValue: { sendDM: result },
            })

            await IotData.publish(
               `tscity/user/${target_user.sub}`,
               { message: filtered_result.data.sendDM, subtopic: IoTSubtopics.receive_dm }
            )
         }
      )

      return result;
   }
   catch (error) {
      throw new Error('Could not send your message. :(');
   }
}