import { BaseEntity, Entity, PrimaryColumn, OneToOne, JoinColumn } from "typeorm";
import { User } from "../user/typedef";

// @ObjectType()
@Entity()
export class Block extends BaseEntity {
   @PrimaryColumn()
   blocked_user_id: number;

   @PrimaryColumn()
   user_id: number;

   @OneToOne(type => User)
   @JoinColumn({ name: 'blocked_user_id', referencedColumnName: 'id' })
   blocked_user: User;

   constructor(data: { user_id: number; blocked_user_id: number }) {
      super();
      Object.assign(this, data);
   }
}