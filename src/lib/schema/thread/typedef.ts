import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToMany, JoinColumn, ManyToMany, JoinTable, Index } from 'typeorm'
import { ObjectType, Field, Int } from 'type-graphql';
// import { FieldAuthGuard } from 'lib/auth/typegraphql_decorators/FieldAuthGuard'
// import Groups from 'lib/auth/groups'
// import { UserRoleType } from 'lib/schema/user/roles'
// import { PostModeType } from './post_modes'
// import { ThreadUserAccess } from '../ThreadUserAccess/typedef';
// import { User } from '../user/typedef';
console.log("THREAD_IMPORTED")

@ObjectType() // Think of this as OutputType
@Entity()
export class Thread extends BaseEntity {

   @Field(type => Int)
   @PrimaryGeneratedColumn()
   id: number;

   @Field({ nullable: true })
   // Using @Index in addition to @Column allows me to make a column
   // that requires unique values, but allows multiple nulls.
   @Index({ unique: true, where: "internal_name IS NOT NULL" })
   @Column({ nullable: true })
   internal_name: string;

   @Field({ nullable: true })
   @Column({ nullable: true })
   display_name: string;

   @Field({ nullable: false })
   @Column({ nullable: false, default: '' })
   description: string;

   // @Field(type => [String], { description: 'Groups who can view this thread, like Admins, Subscribers, etc' })
   // @Column('simple-json')
   // access_groups: UserRoleType[];

   @Field(type => [Number], { description: 'Specific users, listed by ID, who can view this thread' })
   access_users: number[];

   @Field(type => Boolean, { description: 'Whether this thread is a room or not' })
   @Column({ nullable: false, default: false })
   room: boolean;

   @Field(type => Boolean, { description: 'Whether this thread is a DM or not' })
   @Column({ nullable: false, default: false })
   is_dm: boolean;

   @Field(type => Boolean, { description: 'Should the client automatically be put in this room when they load the chat?'})
   @Column({ nullable: false, default: false })
   primary_room: boolean;

   @Field(type => Boolean, { description: 'Should the client automatically be subscribed to this room when they load that?' })
   @Column({ nullable: false, default: false })
   startup_room: boolean;

   // @Field(type => [Number], { description: 'Specific users, listed by ID, who have messages in this thread.' })
   // @Column('simple-json')
   // participant_ids: number[];

   @Field(type => Boolean, { description: 'Used for rooms only, determines whether this room appears in client for all users or just in admin control panel.' })
   @Column({ nullable: false, default: true })
   enabled: boolean;

   // @Field(type => [String], { description: 'List of post modes that determine the rules for posting in a thread' })
   // @Column('simple-json')
   // post_mode: PostModeType[];

   constructor(data: Partial<Thread>) {
      super();
      Object.assign(this, {}, data)
   }
}