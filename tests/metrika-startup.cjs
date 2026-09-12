const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = readFileSync('js/cookie-consent.js', 'utf8');
function run(choice, storageBlocked = false) {
  const inserted = [], handlers = {}, banners = [];
  let stored = choice;
  const window = {location: {href: 'https://example.test/?utm_source=qa'}, localStorage: {
    getItem() { if(storageBlocked) throw Error('blocked'); return stored; },
    setItem(k, v) { if(storageBlocked) throw Error('blocked'); stored = v; }
  }};
  const first = {parentNode: {insertBefore(s) {inserted.push(s);}}};
  const document = {scripts: [], referrer: '',
    getElementsByTagName: () => [first], querySelector: () => null,
    body: {prepend: b => banners.push(b)},
    createElement: () => ({dataset: {}, setAttribute() {}, remove() {},
      querySelector: s => ({addEventListener: (event, fn) => {handlers[s] = fn;}})})
  };
  vm.runInNewContext(code, {window, document});
  return {window, inserted, banners, handlers, stored: () => stored};
}
for (const choice of [null, 'analytics']) {
  const r = run(choice);
  assert.equal(r.inserted.length, 1);
  assert.match(r.inserted[0].src, /112287829/);
  assert.equal(r.window.ym.a[0][1], 'init');
  assert.equal(r.banners.length, choice ? 0 : 1);
}
const refused = run('necessary');
assert.equal(refused.inserted.length, 0);
assert.equal(refused.window.disableYaCounter112287829, true);
const fresh = run(null);
fresh.handlers['[data-cookie-accept]']();
assert.equal(fresh.inserted.length, 1, 'acknowledgement must not double-init');
const optedOut = run(null);
optedOut.handlers['[data-cookie-necessary]']();
assert.equal(optedOut.stored(), 'necessary');
assert.equal(optedOut.window.ym.a.at(-1)[1], 'destruct');
assert.equal(optedOut.window.disableYaCounter112287829, true);
assert.equal(run(optedOut.stored()).inserted.length, 0);
assert.equal(run(null, true).inserted.length, 1);
console.log('PASS: immediate init, correct counter, no double init, old refusal, new opt-out, reload, blocked storage');
