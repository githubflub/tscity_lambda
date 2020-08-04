//https://github.com/typeorm/typeorm/issues/2623#issuecomment-504549881

import {
   Connection,
   ConnectionOptions,
   DefaultNamingStrategy,
} from 'typeorm'
import { RelationLoader } from 'typeorm/query-builder/RelationLoader'
import { RelationIdLoader } from 'typeorm/query-builder/RelationIdLoader'

export const injectConnectionOptions = (connection: Connection, connectionOptions: ConnectionOptions) => {
   /**
    * from Connection constructor()
    */

   // @ts-ignore
   connection.options = connectionOptions
   // @ts-ignore
   connection.manager = connection.createEntityManager();
   // @ts-ignore
   connection.namingStrategy = connection.options.namingStrategy || new DefaultNamingStrategy();
   // @ts-ignore
   connection.relationLoader = new RelationLoader(connection);
   // @ts-ignore
   connection.relationIdLoader = new RelationIdLoader(connection);

   /**
    * from Connection connect()
    */
   // @ts-ignore
   connection.buildMetadatas();

   return connection;
 }