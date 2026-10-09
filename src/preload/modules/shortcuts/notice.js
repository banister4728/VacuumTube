//small on-screen pill that tells the user a shortcut was activated (volume and speed have their own indicators)

const fs = require('fs')
const path = require('path')
const css = require('../../util/css')
const functions = require('../../util/functions')
const localeProvider = require('../../util/localeProvider')

let element;
let timeout;

async function init() {
    await functions.waitForCondition(() => !!document.body)

    css.inject('shortcut-notice', fs.readFileSync(path.join(__dirname, 'notice.css'), 'utf-8'))

    element = functions.el('div', { id: 'vt-shortcut-popup' })
    document.body.appendChild(element)
}

//accepts either literal text or a key from locale.general.shortcuts
function show(textOrKey) {
    if (!element) return;

    let text = localeProvider.getLocale()?.general?.shortcuts?.[textOrKey] ?? textOrKey;

    element.textContent = text;
    element.classList.add('visible')

    clearTimeout(timeout)
    timeout = setTimeout(() => {
        element.classList.remove('visible')
    }, 1500)
}

module.exports = {
    init,
    show
}
