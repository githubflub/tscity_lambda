
import { mergeManyToManyRawResults } from './mergeManyToMany'
import { test_cases } from './mergeManyToMany.test_cases'
import { expect } from 'chai'
import 'mocha';


describe('mergeManyToManyRawResults',
   () => {
      test_cases.forEach(test_case => {
         it(test_case.it || 'should turn input into output', () => {
            const result = mergeManyToManyRawResults(
               test_case.input,
               { alias: 't', groupby: 'id' },
               { 'access_users': 'u', 'poop': 'v' },
               test_case.single_column,
            )

            // console.log("TEST RESULT", JSON.stringify(result, null, 2));

            expect(result).to.have.ordered.deep.members(test_case.output);
         })
      })
   }
)

