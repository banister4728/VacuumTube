const rcMod = require('../../util/resolveCommandModifiers')
const shortcuts = require('./dispatcher')
const notice = require('./notice')

module.exports = () => {
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
            notice.show('captions_off')
            rcMod.resolveCommand({
                commandMetadata: {
                    webCommandMetadata: {
                        clientAction: true
                    }
                },
                selectSubtitlesTrackCommand: {} //off
            })
        } else {
            notice.show('captions_on')
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
}
