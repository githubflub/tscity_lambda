declare module NodeJS {
   interface Global {
      schema: any;
      database_connection: any;
      cognito_public_keys: any;
   }
}