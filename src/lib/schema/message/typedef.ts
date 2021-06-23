import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn, OneToMany, RelationId, ManyToMany, JoinTable } from 'typeorm'
import { ObjectType, Field, ID, Int } from 'type-graphql';
import { MessageTarget } from '../MessageTarget/typedef';
import { MessageSenderGroup } from '../MessageSenderGroup/typedef';
import { Thread } from '../thread/typedef';
import { MessageSenderType } from '../MessageSender/typedef'
console.log("MESSAGE_IMPORTED")

@ObjectType()
@Entity()
export class Message extends BaseEntity {

   @Field(type => Int)
   @PrimaryGeneratedColumn()
   id: number;

   @Field(type => Int, { nullable: false })
   @Column({ nullable: false })
   sender_id: number;

   @Field(type => String, { nullable: false })
   @Column({ nullable: false })
   sender_username: string;

   @Field(type => String, { nullable: true })
   @Column({ nullable: true })
   sender_display_name?: string;

   @Field(type => [MessageSenderGroup])
   @OneToMany("MessageSenderGroup", "message")
   sender_groups: MessageSenderGroup[];

   @Field(type => MessageSenderType, { nullable: false })
   @Column('simple-json', { nullable: false })
   sender: MessageSenderType;

   // The thread from which a message should be
   // treated as being sent from.
   @Field(type => Int, { nullable: false })
   @Column({ nullable: false })
   origin_thread_id: number;

   @Field(type => String, { nullable: false })
   @Column({ nullable: false })
   thread_id: string;

   @ManyToMany("Thread")
   @JoinTable({
      name: "message_thread",
      joinColumn: {
         name: "message_id",
         referencedColumnName: "id",
      },
      inverseJoinColumn: {
         name: "thread_id",
         referencedColumnName: "id",
      }
   })
   threads: Thread[];

   @Field(type => [Int])
   @RelationId("threads")
   thread_ids: number[];

   @Field(type => [MessageTarget])
   @OneToMany("MessageTarget", "message")
   targets: MessageTarget[];

   @Field({ nullable: false })
   @CreateDateColumn({ nullable: false })
   send_time: Date;

   @Field(type => String, { nullable: false })
   @Column({ nullable: false })
   content: string;

   @Field({ nullable: true })
   @Column({ type: "varchar", length: 32, nullable: true })
   type?: "me" | "private";

   @Field(type => String, { nullable: false }) // field's value cannot be null.
   @Column({ type: "varchar", length: 32, nullable: false, default: "whitelist" })
   thread_list_interpretation: "whitelist" | "blacklist";

   constructor(data: Partial<Message>) {
      super();
      Object.assign(this, {}, data)
   }
}