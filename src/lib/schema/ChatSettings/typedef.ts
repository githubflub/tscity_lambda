import { Entity, Column, PrimaryColumn, BaseEntity } from 'typeorm'
import { ObjectType, Field, ID } from 'type-graphql';
console.log("CHAT_SETTINGS_IMPORTED")

@ObjectType()
@Entity()
export class ChatSettings extends BaseEntity {

   // This is nullable so I can return some default chat
   // settings to the UI (for unauthenticated users)
   // However, if someone wants to write to the DB,
   // they MUST include a user_id
   @Field(type => ID, { nullable: true })
   @PrimaryColumn()
   user_id: string;

   @Field(type => String, { nullable: false })
   @Column({ nullable: false, default: 'rooms' })
   primary_room: string;

   @Field(type => [ID])
   @Column('simple-json')
   startup_rooms: number[];

   @Field(type => Boolean)
   @Column({ nullable: false, default: false })
   startup_no_room: boolean;

   constructor(data: Partial<ChatSettings>) {
      super();
      Object.assign(this, {}, data)
   }
}