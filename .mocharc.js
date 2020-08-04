module.exports = {
   spec: ["src/**/*.test.ts", "test/**/*.test.ts"],
   require: [
      'test/mocha.env',
      'ts-node/register'
   ],
   extension: [
      'ts'
   ]
}