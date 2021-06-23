// This function is written with the assumption that
// a connection to the database has already been established.

import { APIGatewayProxyEvent } from "aws-lambda";
import { IpAddress } from "lib/schema/IpAddress/typedef";
import { User } from "lib/schema/user/typedef";

export async function trackUserIpAddress(event: APIGatewayProxyEvent, user: User) {
   const ip_address = event?.requestContext?.identity?.sourceIp;

   if (!ip_address) {
      // If there's no ip address, there's nothing to do.
      return
   }

   if (!((user.ip_addresses || []).includes(ip_address))) {
      // If the user's known ip addresses do not include the
      // current ip address, then we must update their known ip
      // addresses. Otherwise, there's no need to do anything.

      const ip_address_entity = new IpAddress({ ip_address })
      await ip_address_entity.save(); // will this fail if ip already exists?

      const ip_address_entities = user.ip_addresses
         .map(user_ip_address => {
            return new IpAddress({ ip_address: user_ip_address })
         })

      ip_address_entities.push(ip_address_entity)

      user.user_ip_addresses = ip_address_entities;
      await user.save();
   }
}