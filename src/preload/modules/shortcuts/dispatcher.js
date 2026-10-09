//dispatches keyboard shortcuts while a video is playing to named actions registered by the other files in this module
//users can rebind them with the "keybinds" object in config.json

const keyCombo = require('./keyCombo')
const configManager = require('../../config')

const DEFAULT_KEYBINDS = {
    volumeUp: [ 'arrowup' ],
    volumeDown: [ 'arrowdown' ],
    mute: [ 'm' ],
    speedUp: [ 'd' ],
    speedDown: [ 'a' ],
    speedReset: [ 's' ], //toggles between normal speed and the last non-normal speed
    toggleCaptions: [ 'c' ],
    playPause: [ 'space' ],
    seekBackward: [ 'arrowleft' ],
    seekForward: [ 'arrowright' ],
    toggleFullscreen: [ 'f' ]
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

//true when the video itself has focus, meaning no menu is open and no player control is selected
//leanback marks focused elements (and their ancestors) with zylon-focus, so the deepest ones tell us where focus actually is
//if we can't tell, this returns false so that leanback keeps its own arrow key navigation
function isPlayerIdle() {
    let focused = [ ...document.querySelectorAll('.zylon-focus') ].filter((el) => !el.querySelector('.zylon-focus'))
    if (focused.length === 0) return false;

    return focused.every((el) => el.matches('ytlr-shorts-page') || !!el.querySelector('video'))
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
        let binding = bindings[name]?.find((b) => keyCombo.matches(b, e))
        if (!binding) continue;

        //arrow keys step aside while a menu or the player controls are being navigated (can be disabled with menu_guard: false in config.json)
        if (keyCombo.isPlainArrow(binding) && configManager.get().menu_guard !== false && !isPlayerIdle()) continue;

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
