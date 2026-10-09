const fs = require('fs')
const path = require('path')
const rcMod = require('../../util/resolveCommandModifiers')
const css = require('../../util/css')
const functions = require('../../util/functions')
const shortcuts = require('../../util/shortcuts')
const configManager = require('../../config')

const config = configManager.get()

const SPEED_STEP = 0.25

module.exports = async () => {
    const el = functions.el;

    await functions.waitForCondition(() => !!document.body)
    const cssPath = path.join(__dirname, 'style.css')
    const text = fs.readFileSync(cssPath, 'utf-8')

    css.inject('speed-control', text)

    let lastCustomPlaybackRate = 2;
    let currentPlacbackRate = 1;
    let speedTimeout;

    function createSpeedIndicator() {
        return el('div', { id: 'vt-speed-indicator' }, [
            el('div', { id: 'vt-speed-icon', className: 'vt-speed-icon' }),
            el('span', { id: 'vt-speed-text', className: 'vt-speed-text' })
        ]);
    }

    const speedIndicatorElement = createSpeedIndicator()
    document.body.appendChild(speedIndicatorElement)

    function showSpeedIndicator() {
        const indicator = document.getElementById('vt-speed-indicator')
        const text = document.getElementById('vt-speed-text')
        if (!indicator || !text) return;

        text.textContent = `${currentPlacbackRate}x`
        indicator.classList.add('visible')

        clearTimeout(speedTimeout)
        speedTimeout = setTimeout(() => {
            indicator.classList.remove('visible')
        }, 1500)
    }

    function setPlaybackRate(step) {
        let players = document.querySelectorAll('.html5-video-player')
        for (let player of players) {
            if (!player?.setPlaybackRate) continue;

            currentPlacbackRate = player.getPlaybackRate()

            if (step == 0) // toggle between normal and last non normal speed
            {
                if (currentPlacbackRate != 1) {
                    lastCustomPlaybackRate = currentPlacbackRate
                    currentPlacbackRate = 1
                } else {
                    currentPlacbackRate = lastCustomPlaybackRate
                }
            }
            else // increase/decreade by step speed
            {
                currentPlacbackRate = Math.max(0.25, Math.min(currentPlacbackRate + step, 2)) // clamp between 0.25 and 2
            }

            player.setPlaybackRate(currentPlacbackRate)
        }
    }

    shortcuts.register('speedReset', () => { setPlaybackRate(0); showSpeedIndicator() }) // toggle
    shortcuts.register('speedDown', () => { setPlaybackRate(-SPEED_STEP); showSpeedIndicator() })
    shortcuts.register('speedUp', () => { setPlaybackRate(SPEED_STEP); showSpeedIndicator() })
}
