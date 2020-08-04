// Used to output an acceptable context object for lambda custom authorizer
// which only allow strings, numbers, and booleans
export function stringifyProperties(object = {}) {
   const result = {}
   Object.keys(object).forEach(key => {
      const is_ok = typeof object[key] === 'number'
         || typeof object[key] === 'string'
         || typeof object[key] === 'boolean'

      if (!is_ok) {
         if (typeof object[key] === 'object') {
            result[key] = JSON.stringify(object[key])
         }
         else {
            result[key] = `${object[key]}`
         }
      }
      else {
         result[key] = object[key]
      }
   })

   return result
}