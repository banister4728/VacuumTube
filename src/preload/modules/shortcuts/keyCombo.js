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
    matches,
    resolveBindings
}
