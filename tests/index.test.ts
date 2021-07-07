import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { add } from '../src/index'

function describe(name: string, fn: (...args: any[]) => void) {
  const s = suite(name)
  fn(s)
  s.run()
}

describe('add', (it) => {
  it('adds', () => {
    assert.equal(add(4, 5), 9)
  })
})
