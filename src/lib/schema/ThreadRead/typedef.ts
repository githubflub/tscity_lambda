import { Entity, PrimaryColumn, Column, BaseEntity } from "typeorm";
import { Field, ObjectType, GraphQLISODateTime, Int } from "type-graphql";

@ObjectType()
@Entity()
export class ThreadRead extends BaseEntity {
   @Field(type => Int, { nullable: false })
   @PrimaryColumn()
   thread_id: number;

   @Field(type => Int, { nullable: false })
   @PrimaryColumn()
   user_id: number;

   @Field(type => GraphQLISODateTime, { nullable: false })
   @Column({
      type: "timestamp",
      precision: 6,
      nullable: false,
      default: () => 'CURRENT_TIMESTAMP(6)'
   })
   timestamp: Date;

   constructor(data: { thread_id: number; user_id: number; timestamp: Date; }) {
      super();
      Object.assign(this, {}, data);
   }
}