const assert = require('node:assert/strict')
const { BUEN_FIN, BUEN_FIN_OFFERS, isBuenFinActive, getServerTime } = require('../src/data/buenFin2026')
const cases = [
  ['before opening', '2026-11-13T05:59:59.999Z', false],
  ['opening in CDMX', '2026-11-13T06:00:00.000Z', true],
  ['last day', '2026-11-17T18:00:00.000Z', true],
  ['last millisecond', '2026-11-18T05:59:59.999Z', true],
  ['closed in CDMX', '2026-11-18T06:00:00.000Z', false],
  ['next year', '2027-11-13T12:00:00.000Z', false],
]
for (const [label, input, expected] of cases) assert.equal(isBuenFinActive(Date.parse(input)), expected, label)
for (const time of [NaN, null, undefined, '2026-11-14']) assert.equal(isBuenFinActive(time), false)
assert.equal(getServerTime('Fri, 13 Nov 2026 06:00:00 GMT', '12'), BUEN_FIN.start + 12000)
assert.equal(getServerTime('Fri, 13 Nov 2026 06:00:00 GMT', null), BUEN_FIN.start)
for (const date of [null, '', 'garbage']) assert.equal(getServerTime(date), null)
assert.equal(getServerTime('Fri, 13 Nov 2026 06:00:00 GMT', '-1'), null)
assert.deepEqual(BUEN_FIN_OFFERS.map(offer => offer.price), ['$3,900', '$3,500', '$4,500'])
console.log('Buen Fin: dates, timezone boundaries, fail-closed clock and approved prices OK')
