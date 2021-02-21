

var PluginParameters = [
    {name: "MIDI-Länge", type: "log", unit: "Beats", defaultValue: 0.5, minValue: 0.1, maxValue: 16, numberOfSteps: 1000},
    {name: "Manuelles NoteOff", type: "menu", defaultValue: 0, valueStrings: ["on", "off"]}
    ];
var NeedsTimingInfo = true;

var turnOff = [];


function HandleMIDI(event) {
    event.beatPos = 0.001 * Math.round(event.beatPos * 1000);
    if (event instanceof NoteOn) {
        event.send();

        noteOff = new NoteOff;
        noteOff.velocity = event.velocity;
        noteOff.pitch = event.pitch;

        turnOff[event.beatPos + GetParameter(0)] = event.pitch;
        noteOff.sendAtBeat(event.beatPos + GetParameter(0));
    } else if (event instanceof NoteOff) {
        if (GetParameter(1) === 1) {
            if (turnOff[event.beatPos] === event.pitch) {
                turnOff[event.beatPos] = undefined;
                event.send();
            }
        } else {
            event.send();
        }
    }
}