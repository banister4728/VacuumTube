//panel for rebinding the playback keyboard shortcuts (see ../../shortcuts)

const { el } = require('../dom')
const scroll = require('../scroll')
const configManager = require('../../../config')
const keyCombo = require('../../shortcuts/keyCombo')
const DEFAULT_KEYBINDS = require('../../shortcuts/defaults')

const viewport = scroll.bindViewport('shortcuts')

const ACTIONS = Object.keys(DEFAULT_KEYBINDS)

let locale = null;
let capturing = null; //the action currently waiting for a key press

const asList = (value) => (Array.isArray(value) ? value : [ value ]).filter((combo) => keyCombo.parse(combo))
const sameCombo = (a, b) => JSON.stringify(keyCombo.parse(a)) === JSON.stringify(keyCombo.parse(b))
const sameList = (a, b) => a.length === b.length && a.every((combo, i) => sameCombo(combo, b[i]))

//the effective keys for every action, defaults overlaid with the user's overrides
function currentBindings() {
    const overrides = configManager.get().keybinds || {}

    const bindings = {}
    for (const action of ACTIONS) {
        bindings[action] = asList(action in overrides ? overrides[action] : DEFAULT_KEYBINDS[action])
    }

    return bindings;
}

//binds an action to a single key (or unbinds it with null), taking the key away from any other action that used it
function setBinding(action, combo) {
    const bindings = currentBindings()

    for (const other of ACTIONS) {
        if (other !== action) bindings[other] = bindings[other].filter((existing) => !sameCombo(existing, combo))
    }
    bindings[action] = combo ? [ combo ] : []

    //only store what differs from the defaults
    const overrides = {}
    for (const name of ACTIONS) {
        if (!sameList(bindings[name], asList(DEFAULT_KEYBINDS[name]))) overrides[name] = bindings[name];
    }

    configManager.set({ keybinds: overrides })
    updateRows()
}

function keysText(action, bindings) {
    const list = bindings[action]
    return list.length ? list.map(keyCombo.format).join(', ') : locale.settings.shortcuts.unbound;
}

function updateRows() {
    const root = document.querySelector('.vt-content-panel[data-panel="shortcuts"]')
    if (!root) return;

    const bindings = currentBindings()

    root.querySelectorAll('.vt-shortcut-item').forEach((item) => {
        const action = item.dataset.shortcut
        const isCapturing = action === capturing;

        item.classList.toggle('vt-shortcut-capturing', isCapturing)

        const keys = item.querySelector('.vt-shortcut-keys')
        keys.textContent = isCapturing ? locale.settings.shortcuts.press_key : keysText(action, bindings)
        keys.classList.toggle('vt-shortcut-unbound', !isCapturing && bindings[action].length === 0)
    })
}

function stopCapturing() {
    capturing = null;
    updateRows()
}

module.exports = {
    id: 'shortcuts',

    init(ctx) {
        locale = ctx.locale;
    },

    render() {
        return el('div', { className: 'vt-shortcuts-section' }, [
            el('p', {
                className: 'vt-shortcuts-description',
                textContent: locale.settings.shortcuts.description
            }),
            el('div', { className: 'vt-shortcuts-viewport' }, [
                el('div', { className: 'vt-shortcuts-list', id: 'vt-shortcuts-list' },
                    ACTIONS.map((action, idx) =>
                        el('div', {
                            className: 'vt-shortcut-item',
                            dataShortcut: action,
                            dataIndex: String(idx)
                        }, [
                            el('span', { className: 'vt-shortcut-name', textContent: locale.settings.shortcuts.actions[action] || action }),
                            el('span', { className: 'vt-shortcut-keys' })
                        ])
                    )
                ),
                el('div', { className: 'vt-scrollbar', id: 'vt-shortcuts-scrollbar' }, [
                    el('div', { className: 'vt-scrollbar-thumb', id: 'vt-shortcuts-scrollbar-thumb' })
                ])
            ]),
            el('div', { className: 'vt-button', dataAction: 'reset-shortcuts', dataIndex: String(ACTIONS.length) }, [
                el('span', { textContent: locale.settings.shortcuts.reset })
            ])
        ])
    },

    setup() {
        viewport.setup()
    },

    onShow() {
        capturing = null;
        viewport.reset()
        updateRows()
    },

    onFocusItem(element) {
        viewport.scrollTo(element)
    },

    //activating a row starts listening for its new key, activating it again cancels
    onActivate(element) {
        const action = element?.dataset?.shortcut;
        if (!action) return;

        capturing = capturing === action ? null : action;
        updateRows()
    },

    //while capturing, the overlay hands every key press to us instead of navigating
    isCapturing() {
        return capturing !== null;
    },

    onCaptureKey(e) {
        if (e.key === 'Escape') return stopCapturing();
        if (e.key === 'Backspace' || e.key === 'Delete') {
            setBinding(capturing, null)
            return stopCapturing();
        }

        if (e.repeat || !e.code) return; //no code means a simulated key press from a controller, which can't be bound

        const combo = keyCombo.fromEvent(e)
        if (!combo) return; //just a modifier so far, keep waiting for the actual key

        setBinding(capturing, combo)
        stopCapturing()
    },

    onConfigUpdate(config) {
        if (!config || config.keybinds === undefined) return;

        updateRows()
    },

    actions: {
        'reset-shortcuts': async () => {
            capturing = null;
            configManager.set({ keybinds: {} })
            updateRows()
        }
    }
}
