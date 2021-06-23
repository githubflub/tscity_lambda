import { Entity, Column, PrimaryColumn, BaseEntity } from 'typeorm'

console.log("THREAD_SILENCE_IMPORTED")

@Entity()
export class ThreadSilence extends BaseEntity {

   @PrimaryColumn()
   thread_id: number;

   @PrimaryColumn()
   user_id: number;

   @Column({ nullable: true, default: () => 'null'}) // null value means perma silenced
   expires: Date;

   @Column({ nullable: false, default: '' })
   reason: string;

   @Column({ nullable: false })
   silenced_by: string; // typically a user_id or the system.

   constructor(data: Partial<ThreadSilence>) {
      super();
      Object.assign(this, {}, data)
   }
}