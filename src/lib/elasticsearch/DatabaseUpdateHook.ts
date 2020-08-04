import { EventSubscriber, EntitySubscriberInterface, UpdateEvent } from 'typeorm'
import { User } from 'lib/schema/user/typedef'

// Can these be async functions?
// I've decided not to use elasticsearch, so I don't need this now
// I may make use of it in the future though, so I won't delete it.
@EventSubscriber()
export class DatabaseUpdateHook implements EntitySubscriberInterface<User> {
   listenTo() {
      return User;
   }

   afterUpdate(event: UpdateEvent<User>) {
      console.log("DatabaseUpdateHook afterUpdate", event.entity);
   }
}