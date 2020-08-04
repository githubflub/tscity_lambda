import { BaseEntity, Entity, PrimaryColumn } from "typeorm";

// @ObjectType()
@Entity()
export class ThreadUserAccess extends BaseEntity {
   @PrimaryColumn()
   thread_id: number;

   @PrimaryColumn()
   user_id: number;

   constructor(data: { thread_id: number; user_id: number }) {
      super();
      Object.assign(this, {}, data);
   }
}