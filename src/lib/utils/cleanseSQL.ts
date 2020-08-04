const REGEX = /[\W\s]+/g

function die() {
   console.log("Invalid term! Bailing!")
   throw new Error('InvalidInput');
}

export function cleanseSQL(str: string): string {
   let result = ''
   console.log("Cleansing term:", str);
   if (typeof str !== 'string') die();
   result = str.replace(REGEX, ' ')
   result = result.trim();
   result = result.replace(/ /g, '%')
   if (!result) die();
   console.log("Cleansed term:", result);

   return result;
}