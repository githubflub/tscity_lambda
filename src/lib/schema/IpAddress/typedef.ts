import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "../user/typedef";

console.log("IP_ADDRESS_IMPORTED")

@Entity()
export class IpAddress extends BaseEntity {
   @PrimaryColumn()
   ip_address: string;

   constructor(data: Partial<IpAddress>) {
      super();
      Object.assign(this, {}, data)
   }
}