//parses and matches keyboard shortcut strings like "ctrl+shift+c", "m", "+" or "space"

const MODIFIERS = [ 'ctrl', 'alt', 'shift', 'meta' ]

const ALIASES = {
    control: 'ctrl',
    cmd: 'meta',
    command: 'meta',
    win: 'meta',
    option: 'alt',
    spacebar: 'space',
    esc: 'escape',
    plus: '+',
    minus: '-',
    up: 'arrowup',
    down: 'arrowdown',
    left: 'arrowleft',
    right: 'arrowright'
}

//returns { ctrl, alt, shift, meta, key } or null if the string is invalid
function parse(combo) {
    if (typeof combo !== 'string') return null;

    let trimmed = combo.trim().toLowerCase()
    if (!trimmed) return null;

    //"ctrl++" means ctrl and the plus key, so a trailing "+" is the key itself
    let parts = trimmed === '+' ? ['+'] : trimmed.replace(/\+\+$/, '+plus').split('+')
    parts = parts.map((p) => p.trim()).map((p) => ALIASES[p] ?? p)

    let result = { ctrl: false, alt: false, shift: false, meta: false, key: null }
    for (let part of parts) {
        if (!part) return null;

        if (MODIFIERS.includes(part)) {
            result[part] = true;
        } else if (result.key === null) {
            result.key = part;
        } else {
            return null; //more than one non-modifier key
        }
    }

    if (result.key === null) return null;
    return result;
}

//normalizes KeyboardEvent.key to the same form parse() produces
function normalizeEventKey(key) {
    if (typeof key !== 'string') return null;
    if (key === ' ') return 'space';
    return key.toLowerCase();
}

//shift is only compared for letters, digits and named keys, since for symbols like "+" or "?" it's implied by the key itself (and differs between layouts)
function matches(binding, event) {
    if (!binding) return false;

    let key = normalizeEventKey(event.key)
    if (key !== binding.key) return false;

    if (!!event.ctrlKey !== binding.ctrl) return false;
    if (!!event.altKey !== binding.alt) return false;
    if (!!event.metaKey !== binding.meta) return false;

    let isSymbol = key.length === 1 && !/[a-z0-9]/.test(key)
    if (!isSymbol && !!event.shiftKey !== binding.shift) return false;

    return true;
}

//builds a combo string ("ctrl+shift+c") from a KeyboardEvent, or null for modifier-only presses
//this is the inverse of parse(), shift is left out for symbols for the same reason matches() ignores it
function fromEvent(event) {
    let key = normalizeEventKey(event.key)
    if (!key || [ 'control', 'shift', 'alt', 'altgraph', 'meta', 'os', 'capslock', 'dead' ].includes(key)) return null;

    let isSymbol = key.length === 1 && !/[a-z0-9]/.test(key)

    let parts = []
    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey && !isSymbol) parts.push('shift');
    if (event.metaKey) parts.push('meta');
    parts.push(key)

    return parts.join('+');
}

const KEY_NAMES = { arrowup: '\u2191', arrowdown: '\u2193', arrowleft: '\u2190', arrowright: '\u2192', space: 'Space', escape: 'Esc' }

//human readable version of a combo string, like "Ctrl+Shift+C" or "\u2191"
function format(combo) {
    let parsed = parse(combo)
    if (!parsed) return '';

    let parts = []
    if (parsed.ctrl) parts.push('Ctrl');
    if (parsed.alt) parts.push('Alt');
    if (parsed.shift) parts.push('Shift');
    if (parsed.meta) parts.push('Meta');

    let key = KEY_NAMES[parsed.key] ?? (parsed.key.length === 1 ? parsed.key.toUpperCase() : parsed.key[0].toUpperCase() + parsed.key.slice(1))
    parts.push(key)

    return parts.join('+');
}

//unmodified arrow keys are what leanback itself uses to navigate menus and the player controls
function isPlainArrow(binding) {
    return !!binding && binding.key.startsWith('arrow') && !binding.ctrl && !binding.alt && !binding.shift && !binding.meta;
}

//combines default bindings with user overrides into { action: [parsed bindings] }
//an override can be a string, an array of strings, or ""/[] to unbind the action entirely
function resolveBindings(defaults, overrides) {
    let resolved = {}
    let source = { ...defaults }

    if (overrides && typeof overrides === 'object') {
        for (let action of Object.keys(defaults)) {
            if (action in overrides) source[action] = overrides[action];
        }
    }

    for (let [ action, value ] of Object.entries(source)) {
        let list = Array.isArray(value) ? value : [ value ]
        resolved[action] = list.map(parse).filter(Boolean)
    }

    return resolved;
}

module.exports = {
    parse,
    fromEvent,
    format,
    matches,
    isPlainArrow,
    resolveBindings
}
