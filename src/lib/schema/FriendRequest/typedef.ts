import { Field, ObjectType, Int } from "type-graphql";
import { PrimaryGeneratedColumn, Entity, Column } from "typeorm";
import { TSBaseEntity } from 'lib/schema/TSBaseEntity/typedef'

console.log("FRIEND_REQUEST_IMPORTED")

export enum FriendRequestStatus {
   REJECTED = 'REJECTED',
   SENT = 'SENT',
}

@ObjectType()
@Entity()
export class FriendRequest extends TSBaseEntity {
   @Field(type => Int)
   @PrimaryGeneratedColumn()
   id: number;

   @Field(type => String)
   @Column({ nullable: false })
   target_username: string;

   @Field(type => String)
   @Column({ nullable: false })
   sender_username: string;

   @Field(type => Int)
   @Column({ nullable: false })
   sender_user_id: number;

   @Field(type => Int)
   @Column({ nullable: false })
   target_user_id: number;

   @Column({ type: "varchar", length: 32, nullable: false, default: FriendRequestStatus.SENT })
   status: FriendRequestStatus

   static getRejectAuthorizationKeys(): (keyof FriendRequest)[] {
      return ['target_username']
   }

   static getUnsendAuthorizationKeys(): (keyof FriendRequest)[] {
      return ['sender_username']
   }

   static getAcceptAuthorizationKeys(): (keyof FriendRequest)[] {
      return ['target_username'];
   }

   constructor(data: Partial<FriendRequest>) {
      super();
      Object.assign(this, data)
   }
}