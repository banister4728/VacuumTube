const test = require('node:test')
const assert = require('node:assert')
const keyCombo = require('../src/preload/modules/shortcuts/keyCombo')

const ev = (key, mods = {}) => ({ key, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...mods })

test('parses plain keys, modifiers and aliases', () => {
    assert.deepStrictEqual(keyCombo.parse('M'), { ctrl: false, alt: false, shift: false, meta: false, key: 'm' })
    assert.deepStrictEqual(keyCombo.parse('Ctrl+Shift+C'), { ctrl: true, alt: false, shift: true, meta: false, key: 'c' })
    assert.strictEqual(keyCombo.parse('+').key, '+')
    assert.strictEqual(keyCombo.parse('ctrl++').key, '+')
    assert.strictEqual(keyCombo.parse('Space').key, 'space')
    assert.strictEqual(keyCombo.parse('up').key, 'arrowup')
})

test('rejects invalid combos', () => {
    assert.strictEqual(keyCombo.parse(''), null)
    assert.strictEqual(keyCombo.parse('ctrl+'), null)
    assert.strictEqual(keyCombo.parse('ctrl+a+b'), null)
    assert.strictEqual(keyCombo.parse('shift'), null)
    assert.strictEqual(keyCombo.parse(5), null)
})

test('matches events', () => {
    assert.ok(keyCombo.matches(keyCombo.parse('m'), ev('m')))
    assert.ok(keyCombo.matches(keyCombo.parse('m'), ev('M'))) //caps lock
    assert.ok(!keyCombo.matches(keyCombo.parse('m'), ev('m', { ctrlKey: true })))
    assert.ok(!keyCombo.matches(keyCombo.parse('m'), ev('m', { shiftKey: true })))
    assert.ok(keyCombo.matches(keyCombo.parse('shift+m'), ev('M', { shiftKey: true })))
    assert.ok(keyCombo.matches(keyCombo.parse('space'), ev(' ')))
    assert.ok(keyCombo.matches(keyCombo.parse('+'), ev('+', { shiftKey: true }))) //shift is implied for symbols
    assert.ok(keyCombo.matches(keyCombo.parse('ctrl+arrowup'), ev('ArrowUp', { ctrlKey: true })))
})

test('resolves bindings with overrides', () => {
    let defaults = { mute: ['m'], volumeUp: ['+', '='], speedUp: ['d'] }
    let resolved = keyCombo.resolveBindings(defaults, { mute: 'x', volumeUp: '', bogus: 'q' })

    assert.strictEqual(resolved.mute[0].key, 'x')
    assert.deepStrictEqual(resolved.volumeUp, [])
    assert.strictEqual(resolved.speedUp[0].key, 'd')
    assert.ok(!('bogus' in resolved))
    assert.strictEqual(keyCombo.resolveBindings(defaults, undefined).mute[0].key, 'm')
})

test('identifies unmodified arrow bindings', () => {
    assert.ok(keyCombo.isPlainArrow(keyCombo.parse('arrowup')))
    assert.ok(keyCombo.isPlainArrow(keyCombo.parse('left')))
    assert.ok(!keyCombo.isPlainArrow(keyCombo.parse('ctrl+arrowup')))
    assert.ok(!keyCombo.isPlainArrow(keyCombo.parse('m')))
    assert.ok(!keyCombo.isPlainArrow(null))
})

test('builds combo strings from events', () => {
    assert.strictEqual(keyCombo.fromEvent(ev('m')), 'm')
    assert.strictEqual(keyCombo.fromEvent(ev('M', { shiftKey: true })), 'shift+m')
    assert.strictEqual(keyCombo.fromEvent(ev('C', { ctrlKey: true, shiftKey: true })), 'ctrl+shift+c')
    assert.strictEqual(keyCombo.fromEvent(ev(' ')), 'space')
    assert.strictEqual(keyCombo.fromEvent(ev('ArrowUp')), 'arrowup')
    assert.strictEqual(keyCombo.fromEvent(ev('+', { shiftKey: true })), '+') //shift implied for symbols
    assert.strictEqual(keyCombo.fromEvent(ev('Shift', { shiftKey: true })), null)
    assert.strictEqual(keyCombo.fromEvent(ev('Control', { ctrlKey: true })), null)
})

test('fromEvent output round-trips through parse and matches', () => {
    for (let e of [ ev('m'), ev('M', { shiftKey: true }), ev('+', { shiftKey: true }), ev(' '), ev('ArrowLeft', { ctrlKey: true }), ev('=', { ctrlKey: true }), ev('F5') ]) {
        let combo = keyCombo.fromEvent(e)
        assert.ok(keyCombo.matches(keyCombo.parse(combo), e), combo)
    }
})

test('formats combos for display', () => {
    assert.strictEqual(keyCombo.format('ctrl+shift+c'), 'Ctrl+Shift+C')
    assert.strictEqual(keyCombo.format('arrowup'), '↑')
    assert.strictEqual(keyCombo.format('space'), 'Space')
    assert.strictEqual(keyCombo.format('f5'), 'F5')
    assert.strictEqual(keyCombo.format('+'), '+')
    assert.strictEqual(keyCombo.format('nonsense+'), '')
})
