const test = require('node:test')
const assert = require('node:assert')
const keyCombo = require('../src/preload/util/keyCombo')

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
