import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToMany, JoinTable, RelationId, ManyToOne, JoinColumn } from 'typeorm'
import { Thread } from '../thread/typedef';
import { User } from '../user/typedef';
console.log("CHAT_CONNECTION_IMPORTED")

@Entity()
export class ChatConnection extends BaseEntity {

   @PrimaryGeneratedColumn()
   id: number;

   @Column({ nullable: false, unique: true })
   connection_id: string;

   @Column({ nullable: true })
   user_id: number;

   @ManyToOne("User", "chat_connections")
   @JoinColumn({ name: "user_id", referencedColumnName: "id" })
   user: User;

   @ManyToMany("Thread")
   @JoinTable({
      name: "connection_thread",
      joinColumn: {
         name: "connection_id",
         referencedColumnName: "connection_id",
      },
      inverseJoinColumn: {
         name: "thread_id",
         referencedColumnName: "id"
      }
   })
   subscribed_threads: Thread[];

   @RelationId("subscribed_threads")
   subscribed_thread_ids: number[];

   constructor(data: Partial<ChatConnection>) {
      super();
      Object.assign(this, {}, data)
   }
}