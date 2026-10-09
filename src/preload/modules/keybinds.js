//since leanback is made for tvs and consoles, there are some things you simply can't do, as well as things that are less desirable on keyboards

const ui = require('../util/ui')
const rcMod = require('../util/resolveCommandModifiers')
const patchFunction = require('../util/patchFunction')
const localeProvider = require('../util/localeProvider')
const shortcuts = require('../util/shortcuts')
const { clipboard } = require('electron')

const SEEK_SECONDS = 10

module.exports = async () => {
    await localeProvider.waitUntilAvailable()

    let locale = localeProvider.getLocale()

    //shift+enter to longpress
    let shiftHeld = false;
    let enterHeld = false;
    let shiftEnterHeld = false;

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Shift') shiftHeld = true;
        if (e.key === 'Enter') enterHeld = true;

        shiftEnterHeld = shiftHeld && enterHeld;
    }, true)

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') shiftHeld = false;
        if (e.key === 'Enter') enterHeld = false;

        shiftEnterHeld = shiftHeld && enterHeld;
    }, true)

    patchFunction(window, 'setTimeout', function (setTimeout, callback, delay) {
        if (shiftEnterHeld && /^function\(\)\{[^.]+\.[^(]+\([^,]+,[^)]+\)\}$/.test(callback.toString())) { //very dumb, but it's "function(){x.x(x,x)}", this only is applied when shift and enter are held so it shouldn't cause any issues
            delay = 0;
        }

        return setTimeout(function(...args) {
            callback(...args)
        }, delay);
    })

    //ctrl+shift+c to copy video url
    let lastShortId = null;
    rcMod.addInputModifier((c) => {
        if (c.reelWatchEndpoint) {
            lastShortId = c.reelWatchEndpoint.videoId;
        }

        return c;
    })

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key?.toLowerCase() === 'c') {
            let url;

            let isShort = !!document.querySelector('ytlr-shorts-page')?.classList?.contains('zylon-focus')
            if (isShort && lastShortId) {
                url = `https://youtube.com/shorts/${lastShortId}`
            } else {
                let baseUri = window.yt?.player?.utils?.videoElement_?.baseURI;
                if (!baseUri || !baseUri.includes('/watch?v=')) return;

                let id = baseUri.split('/watch?v=')[1]?.slice(0, 11)
                if (!id) return;

                url = `https://youtu.be/${id}`
            }

            e.preventDefault()
            e.stopImmediatePropagation()
            clipboard.writeText(url)
            ui.toast('VacuumTube', locale.general.video_copied)
        }
    }, true)

    //c to toggle captions (like desktop)
    let captions = false;
    let captionSettings = { useDefaultTrack: true }

    rcMod.addInputModifier((c) => {
        if (c.selectSubtitlesTrackCommand) {
            if (Object.keys(c.selectSubtitlesTrackCommand).length === 0) {
                captions = false;
            } else {
                captions = true;
                captionSettings = c.selectSubtitlesTrackCommand;
            }
        }

        return c;
    })

    function toggleCaptions() { //doesn't actually change boolean value of captions variable because that's handled by the rcMod code above, which will hear these commands (as well as manual ones from toggling the button or changing track)
        if (captions) {
            rcMod.resolveCommand({
                commandMetadata: {
                    webCommandMetadata: {
                        clientAction: true
                    }
                },
                selectSubtitlesTrackCommand: {} //off
            })
        } else {
            rcMod.resolveCommand({
                commandMetadata: {
                    webCommandMetadata: {
                        clientAction: true
                    }
                },
                selectSubtitlesTrackCommand: captionSettings //last known caption settings or the default
            })
        }
    }

    shortcuts.register('toggleCaptions', toggleCaptions)

    shortcuts.register('playPause', () => {
        let video = document.querySelector('video')
        if (!video) return;

        if (video.paused) {
            video.play()
        } else {
            video.pause()
        }
    })

    function seekBy(seconds) {
        let video = document.querySelector('video')
        if (!video || !isFinite(video.duration)) return;

        video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds))
    }

    shortcuts.register('seekBackward', () => seekBy(-SEEK_SECONDS))
    shortcuts.register('seekForward', () => seekBy(SEEK_SECONDS))
}
