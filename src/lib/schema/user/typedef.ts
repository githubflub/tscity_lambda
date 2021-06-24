import { Entity, Column, PrimaryGeneratedColumn, OneToMany, RelationId, JoinColumn, ManyToMany, JoinTable } from 'typeorm'
import { ObjectType, Field, Int } from 'type-graphql';
import { FieldAuthGuard } from 'lib/auth/typegraphql_decorators/FieldAuthGuard'
import Groups from 'lib/auth/groups'
import { UserGroup } from '../UserGroup/typedef';
import { TSBaseEntity } from '../TSBaseEntity/typedef'
import { ChatConnection } from '../chat_connection/typedef';
import { IpAddress } from '../IpAddress/typedef';

console.log("USER BEING IMPORTED")

@ObjectType()
@Entity()
export class User extends TSBaseEntity {
   @Field(type => Int)
   @PrimaryGeneratedColumn()
   id: number;

   @Field()
   @Column({ nullable: false, unique: true })
   username: string;

   @Column({ nullable: false, unique: true })
   sub: string;

   @Field(type => String)
   @Column({ nullable: false, default: '' })
   display_name: string;

   @FieldAuthGuard(Groups.Owner)
   @Field({ nullable: true })
   @Column()
   full_name?: string;

   @FieldAuthGuard(Groups.Owner)
   @Field({ nullable: true })
   @Column()
   given_name?: string;

   @FieldAuthGuard(Groups.Owner)
   @Field({ nullable: true })
   @Column()
   email?: string;

   @FieldAuthGuard(Groups.Owner)
   @Field({ nullable: true })
   @Column({ default: false })
   email_verified?: boolean;

   @FieldAuthGuard(Groups.Owner)
   @Field({ nullable: true })
   @Column()
   phone_number?: string;

   @FieldAuthGuard(Groups.Owner)
   @Field({ nullable: true })
   @Column({ default: false })
   phone_verified?: boolean;

   @Field(type => [UserGroup])
   @OneToMany("UserGroup", "user", { eager: true })
   groups?: UserGroup[];

   @OneToMany("ChatConnection", "user")
   chat_connections?: ChatConnection[];

   @ManyToMany("IpAddress")
   @JoinTable({
      name: "user_ip_address",
      joinColumn: {
         name: "user_id",
         referencedColumnName: "id",
      },
      inverseJoinColumn: {
         name: "ip_address",
         referencedColumnName: "ip_address"
      }
   })
   user_ip_addresses?: IpAddress[];

   @RelationId("user_ip_addresses")
   ip_addresses: string[];

   constructor(data: Partial<User>) {
      super();
      Object.assign(this, data)
   }
}