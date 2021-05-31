import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn } from 'typeorm'
import { ObjectType, Field, ID, Int } from 'type-graphql';
import { UserGroup } from 'lib/schema/UserGroup/typedef'
console.log("MESSAGE_IMPORTED")

@ObjectType()
export class MessageSenderType {
   @Field(type => Int)
   id: string

   @Field(type => String)
   username: string

   @Field(type => String)
   display_name: string;

   @Field(type => [UserGroup])
   groups: UserGroup[]
}

@ObjectType()
@Entity()
export class Message extends BaseEntity {

   @Field(type => ID)
   @PrimaryGeneratedColumn()
   id: number;

   // @Field(type => String, { nullable: false })
   // @Column({ nullable: false })
   // sender_id: string;

   @Field(type => MessageSenderType, { nullable: false })
   @Column('simple-json', { nullable: false })
   sender: MessageSenderType;

   @Field(type => String, { nullable: false })
   @Column({ nullable: false })
   thread_id: string;

   @Field({ nullable: false })
   @CreateDateColumn({ nullable: false })
   send_time: Date;

   @Field(type => String, { nullable: false })
   @Column({ nullable: false })
   content: string;

   @Field({ nullable: true })
   @Column({ type: "varchar", length: 32, nullable: true })
   type?: "me" | "private";

   constructor(data: Partial<Message>) {
      super();
      Object.assign(this, {}, data)
   }
}