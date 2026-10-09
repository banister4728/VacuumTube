//configurable keyboard shortcuts for when a video is playing (volume, speed, captions, play/pause, seeking)
//each file registers its actions with the dispatcher, which matches keys against the "keybinds" overrides in config.json

const captions = require('./captions')
const playback = require('./playback')
const volume = require('./volume')
const speed = require('./speed')
const notice = require('./notice')

module.exports = async () => {
    notice.init()
    captions()
    playback()

    await Promise.all([ volume(), speed() ]) //these also set up indicator ui, so they wait for the page
}
