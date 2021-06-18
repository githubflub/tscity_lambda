import { Field, ID, Int, ObjectType } from 'type-graphql';
import { Entity, BaseEntity, ManyToOne, Column, JoinColumn, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm'
import { Message } from '../message/typedef'

// Each MessageSenderGroup is intended to be a snapshot
// of a user's UserGroup at the time that they send a message.
@Entity()
@ObjectType()
export class MessageSenderGroup extends BaseEntity {
   @PrimaryGeneratedColumn()
   id: number;

   @ManyToOne("Message", "sender_groups")
   @JoinColumn({ name: "message_id", referencedColumnName: "id" })
   message: Message;

   @Field(type => String)
   @Column({ nullable: false })
   context: string;

   @Field(type => Int, { nullable: true })
   @Column({ nullable: true })
   context_id: number;

   @Field(type => String)
   @Column({ nullable: false })
   group: string;

   // The user that this permission applies to.
   @Field(type => Int)
   @Column({ nullable: false })
   user_id: number;

   constructor(data: Partial<MessageSenderGroup>) {
      super();
      Object.assign(this, {}, data)
   }
}