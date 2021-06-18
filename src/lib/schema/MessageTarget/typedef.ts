import { Field, Int, ObjectType } from 'type-graphql';
import { Entity, BaseEntity, ManyToOne, Column, JoinColumn, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm'
import { Message } from '../message/typedef'

@Entity()
@ObjectType()
export class MessageTarget extends BaseEntity {
   @PrimaryGeneratedColumn()
   id: number;

   @ManyToOne("Message", "targets")
   @JoinColumn({ name: "message_id", referencedColumnName: "id" })
   message: Message;

   @Field(type => String, { nullable: false })
   @Column({ type: "varchar", length: 32, nullable: false })
   target_type: "thread" | "user";

   @Field(type => Int, { nullable: true })
   @Column({ nullable: true })
   user_id?: number;

   @Field(type => String, { nullable: true })
   @Column({ nullable: true })
   username?: string;

   @Field(type => String, { nullable: true })
   @Column({ nullable: true })
   user_display_name?: string;

   @Field(type => Int, { nullable: true })
   @Column({ nullable: true })
   thread_id?: number;

   @Field(type => String, { nullable: true })
   @Column({ nullable: true })
   thread_internal_name?: string;

   @Field(type => String, { nullable: true })
   @Column({ nullable: true })
   thread_display_name?: string;

   constructor(data: Partial<MessageTarget>) {
      super();
      Object.assign(this, {}, data)
   }
}