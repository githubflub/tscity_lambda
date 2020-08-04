export function authorizeAgainstObjectKeys(keys, object, value): Boolean {
   if (!value) return false;

   for (let i = keys.length - 1; i >= 0; i--) {
      const key = keys[i];
      if (object[key] === value) return true; // Authorized
   }

   return false;
}