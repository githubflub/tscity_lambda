import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from 'typeorm'
import { ObjectType, Field, ID } from 'type-graphql';
console.log("CHAT_CONNECTION_IMPORTED")

@ObjectType()
@Entity()
export class ChatConnection extends BaseEntity {

   @Field(type => ID)
   @PrimaryGeneratedColumn()
   id: string;

   @Field()
   @Column({ nullable: false, unique: true })
   connection_id: string;

   @Field()
   @Column({ nullable: true })
   user_id: number;

   @Field(type => [ID])
   @Column('simple-array', { nullable: false })
   subscribed_threads: number[]

   constructor(data: Partial<ChatConnection>) {
      super();
      Object.assign(this, {}, data)
   }
}