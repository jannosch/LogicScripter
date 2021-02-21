let notes = ["empty",
    "C1", "C#1", "D1", "D#1", "E1", "F1", "F#1", "G1", "G#1", "A1", "A#1", "B1",
    "C2", "C#2", "D2", "D#2", "E2", "F2", "F#2", "G2", "G#2", "A2", "A#2", "B2",
    "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3",
    "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
    "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5",
    "C0", "C#0", "D0", "D#0", "E0", "F0", "F#0", "G0", "G#0", "A0", "A#0", "B0"
];



var PluginParameters = [
    {name: "Mask-Time", type: "lin", unit: "ms", defaultValue: 0, minValue: 0, maxValue: 10000, numberOfSteps: 10000},
    {name: "Min-Velocity", type: "lin", unit: "", defaultValue: 0, minValue: 0, maxValue: 127, numberOfSteps: 127},
    {name: "Max-Velocity", type: "lin", unit: "", defaultValue: 127, minValue: 0, maxValue: 127, numberOfSteps: 127},
    {name: "Mask-Note", type: "menu", defaultValue: 0, valueStrings: notes},
    {name: "Filter-Above", type: "menu", defaultValue: 0, valueStrings: notes},
    {name: "Filter-Below", type: "menu", defaultValue: 0, valueStrings: notes},
];
var NeedsTimingInfo = true;

let maskUntil = new Map(); // midi-note -> next free beat
let maskedNotes = new Map(); // midi-note -> number masked notes

function HandleMIDI(event) {

    if (event instanceof NoteOn) {

        // Filter Above
        if (GetParameter(4) !== 0) {
            let midiAbove = MIDI.noteNumber(notes[GetParameter(4)]);
            if (event.pitch > midiAbove) {
                Trace("a" + midiAbove);
                return;
            }
        }

        // Filter Below
        if (GetParameter(5) !== 0) {
            let midiBelow = MIDI.noteNumber(notes[GetParameter(4)]);
            if (event.pitch < midiBelow) {
                Trace("b" + midiBelow);
                return;
            }
        }

        // If note masked
        if (GetParameter(3) === 0 || notes[GetParameter(3)] === MIDI.noteName(event.pitch)) {

            // Test if has to be time-masked
            if (GetParameter(0) > 0) {
                if (maskUntil.get(event.pitch) !== undefined) {
                    if (event.beatPos <= maskUntil.get(event.pitch)) {
                        Trace("Masked: " + MIDI.noteName(event.pitch) + ", Velocity: " + event.velocity + ", Reason: Time");
                        addMaskedNote(event.pitch, 1);
                        return;
                    }
                }
            }

            // Test if has to be velocity masked
            if (event.velocity < GetParameter(1) ||  event.velocity > GetParameter(2)) {
                Trace("Masked: " + MIDI.noteName(event.pitch) + ", Velocity: " + event.velocity + ", Reason: Velocity");
                addMaskedNote(event.pitch, 1);
                return;
            }

            event.send();

            // Calculate next beat
            let tempo = GetTimingInfo().tempo;
            let time = GetParameter(0);
            let maskLength = (time * tempo) / 60000;
            let beat = event.beatPos;
            let nextBeat = beat + maskLength;

            // Adds to mask
            maskUntil.set(event.pitch, nextBeat);

        } else {
            event.send();
        }
    } else if (event instanceof NoteOff) {
        // Mask NoteOff if NoteOn is Masked
        if (maskedNotes.get(event.pitch) !== undefined) {
            if (maskedNotes.get(event.pitch) > 0) {
                maskedNotes.set(event.pitch, maskedNotes.get(event.pitch - 1));
                return;
            }
        }
        // Else send event
        event.send();

    } else {
        event.send();
    }
}

function addMaskedNote(note, number) {
    if (maskedNotes.get(note) !== undefined) {
        let value = maskedNotes.get(note);
        maskedNotes.set(note, value + number);
    } else {
        maskedNotes.set(note, number);
    }
}




let playing = false;

// Deletes Mask when stopped or played
function ProcessMIDI() {
    let timingInfo = GetTimingInfo();

    if (timingInfo.playing !== playing) {
        playing = timingInfo.playing;
        if (playing === true) {
            maskUntil = new Map();
            maskedNotes = new Map();
        } else {
            maskUntil = new Map();
            maskedNotes = new Map();
        }
    }
}