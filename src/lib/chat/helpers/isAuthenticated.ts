export function isAuthenticated(event) {
   const is_authenticated = event
      && event.requestContext
      && event.requestContext.authorizer
      && (event.requestContext.authorizer.sub || process.env.IS_OFFLINE)
      && event.requestContext.authorizer['cognito:username']

   return !!is_authenticated
}