var NeedsTimingInfo = true;

var PluginParameters = [
    {name: "Sprinkle-Time", type: "log", unit: "ms", defaultValue: 50, minValue: 1, maxValue: 1000, numberOfSteps: 999},
    {name: "Buffer", type: "lin", unit: "Beats", defaultValue: 0.1, minValue: 0.1, maxValue: 4, numberOfSteps: 39}
];

let que = new Set();
let playing = false;
let lastNote = 0;

function HandleMIDI(event) {
    if (lastNote + GetParameter(1) <= event.beatPos) {
        que = new Set();
    }


    if (event instanceof NoteOn) {


        if (que.has(event)) {
            Trace(MIDI.noteName(event.pitch) + " gelöscht");
            que.delete(event);
        } else {
            if (que.size === 0) {
                event.send();
            } else {
                event.sendAfterMilliseconds(que.size * GetParameter(0));
            }
            Trace(MIDI.noteName(event.pitch) + "| Warteschlange: " + que.size);
            que.add(event);
            lastNote = event.beatPos;
            Trace (lastNote);
        }
    } else {
        event.send();
    }
}

function ProcessMIDI() {
    let timingInfo = GetTimingInfo();

    if (timingInfo.playing !== playing) {
        playing = timingInfo.playing;

        for (let event of que) {
            let noteOff = new NoteOff();
            noteOff.pitch = event.pitch;
            noteOff.send();
        }

        que = new Set();
    }
}
