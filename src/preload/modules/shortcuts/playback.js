const shortcuts = require('./dispatcher')

const SEEK_SECONDS = 10

module.exports = () => {
    function seekBy(seconds) {
        let video = document.querySelector('video')
        if (!video || !isFinite(video.duration)) return;

        video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds))
    }

    shortcuts.register('playPause', () => {
        let video = document.querySelector('video')
        if (!video) return;

        if (video.paused) {
            video.play()
        } else {
            video.pause()
        }
    })

    shortcuts.register('seekBackward', () => seekBy(-SEEK_SECONDS))
    shortcuts.register('seekForward', () => seekBy(SEEK_SECONDS))
}
