// A Promise.all that doesn't die if one of the
// promises fail.

function defaultOnError(error) {
   return { error }
}

export function usefulPromiseAll(promises: Array<Promise<any>>, onError: Function = defaultOnError) {

   const safe_promises = promises.map(async promise => {
      try {
         return await promise;
      }
      catch (error) {
         return onError(error)
      }
   })

   return Promise.all(safe_promises)
}