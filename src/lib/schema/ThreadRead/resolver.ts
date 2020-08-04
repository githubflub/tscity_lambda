import { Resolver, Mutation, Ctx, Arg, Int } from "type-graphql";
import { ResolverAuthGuard } from "lib/auth/typegraphql_decorators/ResolverAuthGuard";
import { ThreadReadInput } from "./input_type";
import { ThreadRead } from "./typedef";
import { listThreads } from "../thread/logic/list";
import { getEntity } from "lib/database/logic/getEntity";
import { Thread } from "../thread/typedef";
import { ListManyToManyOptions } from "lib/database/logic/createManyToManyEntityLister";

@Resolver(of => ThreadRead)
export class ThreadReadResolver {
   @ResolverAuthGuard()
   @Mutation(return_type => ThreadRead)
   async updateThreadReadTime(
      @Ctx() context,
      @Arg('thread_id', type => Int, { nullable: false }) thread_id: number
   ) {
      const identity = context.requester_identity;

      const options: ListManyToManyOptions = {
         take: 1,
         where: 't.room = FALSE AND t.id = :thread_id',
         params: { thread_id },
         order: {
            property: 'display_name',
            direction: 'ASC',
         },
      }

      const thread = (await listThreads(options))[0]
      console.log("thread", thread);

      if (
         !thread
         || thread.room
         || !thread.access_users.includes(identity.id)
      ) {
         throw new Error("Can't set read time for this thread.");
      }

      const new_thread_read = new ThreadRead({
         thread_id,
         user_id: identity.id,
         timestamp: new Date(),
      })

      const yay = await new_thread_read.save()

      return yay;
   }
}