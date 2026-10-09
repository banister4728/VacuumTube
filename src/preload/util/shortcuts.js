//configurable keyboard shortcuts for when a video is playing
//modules register named actions here, and users can rebind them with the "keybinds" object in config.json

const keyCombo = require('./keyCombo')
const configManager = require('../config')

const DEFAULT_KEYBINDS = {
    volumeUp: [ '+', '=' ],
    volumeDown: [ '-' ],
    mute: [ 'm' ],
    speedUp: [ 'd' ],
    speedDown: [ 'a' ],
    speedReset: [ 's' ], //toggles between normal speed and the last non-normal speed
    toggleCaptions: [ 'c' ],
    playPause: [ 'k' ],
    seekBackward: [ 'j' ],
    seekForward: [ 'l' ]
}

const actions = {}
let listening = false;
let cache = { overrides: undefined, bindings: null }

function isWatching() {
    let isShort = !!document.querySelector('ytlr-shorts-page')?.classList?.contains('zylon-focus')
    if (isShort) { //very dumb, don't like it, but there doesn't seem to be a better way
        return true;
    } else {
        let baseUri = window.yt?.player?.utils?.videoElement_?.baseURI;
        if (!baseUri || !baseUri.includes('/watch?v=')) return false;

        let id = baseUri.split('/watch?v=')[1]?.slice(0, 11)
        if (!id) return false;

        return true;
    }
}

function getBindings() {
    let overrides = configManager.get().keybinds
    if (cache.bindings && cache.overrides === overrides) return cache.bindings; //config object is replaced on update, so identity check is enough

    cache = { overrides, bindings: keyCombo.resolveBindings(DEFAULT_KEYBINDS, overrides) }
    return cache.bindings;
}

function onKeyDown(e) {
    if (!e.key || !isWatching()) return;

    let target = e.target
    if (target && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName))) return;

    let bindings = getBindings()
    for (let [ name, handler ] of Object.entries(actions)) {
        if (!bindings[name]?.some((binding) => keyCombo.matches(binding, e))) continue;

        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        handler(e)
        return;
    }
}

function register(name, handler) {
    if (!(name in DEFAULT_KEYBINDS)) throw new Error(`Unknown shortcut action: ${name}`);

    actions[name] = handler;

    if (!listening) {
        listening = true;
        document.addEventListener('keydown', onKeyDown, true)
    }
}

module.exports = {
    DEFAULT_KEYBINDS,
    register,
    isWatching
}
