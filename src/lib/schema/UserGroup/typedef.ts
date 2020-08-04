import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne, JoinColumn } from 'typeorm'
import { Field, Int, ObjectType } from 'type-graphql';
import { User } from 'lib/schema/user/typedef'
import { TSBaseEntity } from 'lib/schema/TSBaseEntity/typedef'

console.log('USERGROUP BEING IMPORTED');

@ObjectType() // Think of this as OutputType
@Entity()
export class UserGroup extends TSBaseEntity {
   @Field(type => Int)
   @PrimaryGeneratedColumn()
   id: number;

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
   @Column()
   user_id: number;

   @ManyToOne(type => User, user => user.groups)
   @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
   @Field(type => User)
   user: Promise<User>;

   constructor(data: Partial<UserGroup>) {
      super();
      Object.assign(this, data)
   }
}