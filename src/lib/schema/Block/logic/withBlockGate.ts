import { getBlockList } from "./getBlockList";

export async function withBlockGate(user, description: string, target, action) {
   const target_blocklist = await getBlockList(target.id)
   if (!target_blocklist.includes(user.id)) {
      await action();
   }
   else {
      console.log(`${user['cognito:username']} has tried to ${description || 'send something to'} ${target.username}, who has blocked them. We won't allow it!`)
   }
}