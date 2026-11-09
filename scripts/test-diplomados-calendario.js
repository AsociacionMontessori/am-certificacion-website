const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const source = fs.readFileSync('src/data/diplomadosCalendario.js','utf8').replaceAll('export const','const')
const { dates, next } = vm.runInNewContext(source + ';({dates:DIPLOMADOS_EN_LINEA,next:getNextItem})')
const year = dates.filter(item=>item.kind==='enrollment')
assert.equal(year.length,11)
const expected = ['01-30','02-27','03-27','04-24','05-29','06-26','07-31','08-28','09-25','10-30','11-27']
year.forEach((item,i)=>{
  assert.equal(item.date.toISOString(),`2027-${expected[i]}T06:00:00.000Z`)
  assert.equal(item.date.getUTCDay(),6)
  assert.notEqual(new Date(item.date.getTime()+7*86400000).getUTCMonth(),item.date.getUTCMonth())
  for(const lang of ['es','en','pt-br']) for(const [ns,key] of [['home','countdown'],['diplomados','calendario']]) {
    assert.ok(JSON.parse(fs.readFileSync(`src/i18n/locales/${lang}/${ns}.json`))[key].fechas[`2027-${expected[i]}`])
  }
})
assert.equal(next(dates,Date.parse('2026-11-09T23:00:00Z')).date.toISOString(),'2026-11-28T14:00:00.000Z')
assert.equal(next(dates,Date.parse('2026-11-28T14:00:00Z')).date.toISOString(),'2027-01-30T06:00:00.000Z')
assert.equal(next(dates,Date.parse('2027-01-30T06:00:00Z')).date.toISOString(),'2027-02-27T06:00:00.000Z')
assert.equal(next(dates,Date.parse('2027-11-27T06:00:00Z')),null)
console.log('PASS: all 11 last Saturdays, no December, preserved 2026, monthly rollovers and 3 languages')
