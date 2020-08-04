import { Column, BaseEntity, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Field, GraphQLISODateTime, ObjectType } from 'type-graphql';

console.log("TSBASEENTITY_IMPORTED")

@ObjectType()
export abstract class TSBaseEntity extends BaseEntity {
   @Field(type => GraphQLISODateTime, { nullable: false })
   @CreateDateColumn({ nullable: false })
   create_time: Date;

   @Field(type => GraphQLISODateTime, { nullable: false })
   @UpdateDateColumn({ nullable: false })
   update_time: Date;

   // @Field(type => String, { nullable: false })
   @Column({ nullable: false })
   created_by: string;

   // @Field(type => String, { nullable: false })
   @Column({ nullable: false })
   updated_by: string;
}