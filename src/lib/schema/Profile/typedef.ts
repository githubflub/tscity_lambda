import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from 'typeorm'
import { ObjectType, Field, Int } from 'type-graphql';
import { DEFAULT_PROFILE_VISIBILITY, profile_privacy_options } from '@tscity/shared/profile_visibility'
console.log("PROFILE_IMPORTED")

@ObjectType()
@Entity()
export class Profile extends BaseEntity {

   @Field(type => Int)
   @PrimaryGeneratedColumn()
   id: number;

   @Field(type => Int)
   @Column({ nullable: false, unique: true })
   user_id: number;

   @Field(type => String)
   @Column({ nullable: false })
   username: string;

   @Field(type => String, { nullable: true })
   @Column({ nullable: false, default: '' })
   about_me?: string;

   @Field(type => String)
   @Column({ type: "varchar", length: 32, nullable: false, default: DEFAULT_PROFILE_VISIBILITY })
   visibility: keyof typeof profile_privacy_options;

   constructor(data: Partial<Profile>) {
      super();
      Object.assign(this, {}, data)
   }

   static getRedactableKeys() {
      // Maybe replace this with decorators one day...
      return ['about_me']
   }
}