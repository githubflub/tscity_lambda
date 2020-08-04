import { Field, InputType, Int } from "type-graphql";
import { FriendRequest, FriendRequestStatus } from './typedef'

@InputType()
export class FriendRequestCreateInput implements Partial<FriendRequest> {
   @Field({ nullable: false })
   target_username: string;

   // These can be null on the GraphQL layer
   // But on the data layer, it must have a value.
   @Field({ nullable: true })
   sender_username: string;

   @Field({ nullable: true })
   sender_user_id: number;

   @Field({ nullable: true })
   target_user_id: number;

   @Field(type => String, { nullable: true })
   status: FriendRequestStatus;
}

@InputType()
export class FriendRequestUpdateInput implements Partial<FriendRequest> {
   @Field(type => String, { nullable: true })
   status: FriendRequestStatus;
}

@InputType()
export class FriendRequestDeleteInput implements Partial<FriendRequest> {
   @Field(type => Int, { nullable: false })
   id: number;
}