//default key for each rebindable action (user overrides live in the "keybinds" object in config.json), also used by the settings panel

module.exports = {
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
