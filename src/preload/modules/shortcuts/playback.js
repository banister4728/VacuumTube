const { ipcRenderer } = require('electron')
const shortcuts = require('./dispatcher')
const notice = require('./notice')

const SEEK_SECONDS = 10

module.exports = () => {
    function seekBy(seconds) {
        let video = document.querySelector('video')
        if (!video || !isFinite(video.duration)) return;

        video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds))
        notice.show(`${seconds > 0 ? '+' : '−'}${Math.abs(seconds)}s`)
    }

    shortcuts.register('playPause', () => {
        let video = document.querySelector('video')
        if (!video) return;

        if (video.paused) {
            video.play()
            notice.show('playing')
        } else {
            video.pause()
            notice.show('paused')
        }
    })

    shortcuts.register('seekBackward', () => seekBy(-SEEK_SECONDS))
    shortcuts.register('seekForward', () => seekBy(SEEK_SECONDS))

    shortcuts.register('toggleFullscreen', async () => {
        let fullscreen = await ipcRenderer.invoke('toggle-fullscreen')
        notice.show(fullscreen ? 'fullscreen' : 'windowed')
    })
}
