// CoBotRandom created by Jannis Müller

// All following const's can be changed by you.


const menuSensor = "Sensor-Ton";            // Menu title for sensor-tone
const buttonSensor = "Erkenne-Sensor";      // Button title for sensor-tone-recognition
const menuStop = "Stop-Ton";                // Menu title for stop-tone
const buttonStop = "Erkenne-Stop";          // Button title for stop-tone-recognition
const menuMode = "Zufallsmodus";            // Menu title for Mode-menu
const buttonReset = "Sequenz zurücksetzten";// Button title for generating new random sequence
const sliderSequence = "Sequenzlänge";      // Slider title for adjusting sequence lenght
const toneName = ". Ton";                   // Menu title for output-tones
const probName = ". Warscheinlichkeit";     // Slider title for output-probability
const tones = 8;                            // Number of Tones




// All Notes in the Menus
let notes = ["leer", "lernen",
    "C2", "C#2", "D2", "D#2", "E2", "F2", "F#2", "G2", "G#2", "A2", "A#2", "B2",
    "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3",
    "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
    "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5",
    "C1", "C#1", "D1", "D#1", "E1", "F1", "F#1", "G1", "G#1", "A1", "A#1", "B1",
    "C0", "C#0", "D0", "D#0", "E0", "F0", "F#0", "G0", "G#0", "A0", "A#0", "B0"
];

let sequenceSlider = {name: sliderSequence, type: "lin", hidden: false, unit: "Beats", defaultValue: 0, minValue: 0, maxValue: 64, numberOfSteps: 64};
let resetButton = {name: buttonReset, type:"momentary", hidden: false};


// Head Plugin Parameters
var PluginParameters = [
    {name: menuSensor, type: "menu", defaultValue: 0, valueStrings: notes},
    {name: buttonSensor, type:"momentary"},
    {name: menuStop, type: "menu", defaultValue: 0, valueStrings: notes},
    {name: buttonStop, type:"momentary"},
    {name: menuMode, type: "menu", defaultValue: 0, valueStrings: ["Zufall", "Sequenz"]},
    sequenceSlider,
    resetButton
];
var NeedsTimingInfo = true; // Activate Timing Info
let headParameters = PluginParameters.length;
let probabilitySliders = []; // Array for indexing probability-sliders
let tap = 0; // Determines if Sensor or Stop tone should be chanced in next MIDI Event
let playing = 0; // Which note is Playing?
let sequence = []; // Saves played notes
let update = []; // Which Parameter should be updated

// Creates tone-UI
createTone();

function HandleMIDI(event) {
    if (event instanceof NoteOn) {

        // If Tap Sensor
        if (tap === 1) {
            SetParameter(menuSensor, notes.indexOf(MIDI.noteName(event.pitch)));
            tap = 0;
            // If Tap Stop
        } else if (tap === 2) {
            SetParameter(menuStop, notes.indexOf(MIDI.noteName(event.pitch)));
            tap = 0;
        } else if (event.pitch === MIDI.noteNumber(notes[GetParameter(menuSensor)])) {

            // Stop note
            stopNote();

            let beatPos = Math.round(event.beatPos * 1000);
            let note;
            let probability = 0;

            // Evaluate beatPos
            if (GetParameter(sliderSequence) !== 0) {
                beatPos %= GetParameter(sliderSequence) * 1000;
            }

            // Play random Notes
            if (GetParameter(menuMode) === 0) {
                note = Math.random() * 100;

                // Search for this beat in the sequence otherwise create new one
            } else if (sequence[beatPos] === undefined) {
                note = Math.random() * 100;
                sequence[beatPos] = note;
            } else {
                note = sequence[beatPos];
            }


            for (let i = 1; i <= tones; i++) {
                let thisParam = i + probName;
                probability += GetParameter(thisParam);

                if (probability >= note) {
                    // If no Note is Selected
                    if (GetParameter(i + toneName) === 0) break;

                    // If Note is selected
                    playing = MIDI.noteNumber(notes[GetParameter(i + toneName)]);
                    event.pitch = playing;
                    event.send();
                    Trace("Spiele " + MIDI.noteName(playing) + " mit Velocitiy: " + event.velocity + " ab Beat: " + (beatPos / 1000));
                    break;
                }

            }
        } else if (event.pitch === MIDI.noteNumber(notes[GetParameter(menuStop)])) {
            stopNote();
        }

    } else if (!(event instanceof NoteOff)) {
        event.send();
    }
}

function stopNote() {
    if (playing !== 0) {
        let noteOff = new NoteOff;
        noteOff.pitch = playing;
        noteOff.velocity = 100;
        noteOff.send();
        playing = 0;
    }
}

function ParameterChanged(param, value) {

    /*// Returns if parameter should not recieve update
    Trace(PluginParameters[param].name + " " + update[param]);
    if (!(update[param] === undefined || update[param])) {
        update[param] = undefined;
        return;
    }*/

    // If Probability-Slider is touched
    if (param > headParameters && param % 2 === 0) {
        let allProbabilities = 0;

        // Add up all other probability-values
        for (let i = 1; i <= tones; i++) {
            let thisParam = i + probName;

            // If this Slider
            if (thisParam === probabilitySliders[param]) continue;

            allProbabilities += GetParameter(thisParam);

        }

        // If other Sliders need to be modified
        if (allProbabilities + value > 100) {

            // Factor to multiply every other Tone
            let factor = (100 - value) / allProbabilities;

            for (let i = 1; i <= tones; i++) {
                let thisParam = i + probName;

                // If this Slider
                if (thisParam === probabilitySliders[param]) continue;

                SetParameter(thisParam, GetParameter(thisParam) * factor);

            }
        }

        // If Tap Sensor
    } else if (param === 1) {
        if (tap !== 1) tap = 1;
        else tap = 0;
        // If Tap Stop
    } else if (param === 3) {
        if (tap !== 2) tap = 2;
        else tap = 0;
    }/* else if (param === 4) {
        if (GetParameter(menuMode) === 0) {
            resetButton.hidden = true;
            sequenceSlider.hidden = true;
        } else {
            resetButton.hidden = false;
            sequenceSlider.hidden = false;
        }
        updateParameter(5, 6);
    } else if (param === 6) {
        // Delete sequence
        sequence.length = 0;
    }*/
}


function updateParameter() {
    update = [];

    for (let i = 0; i < PluginParameters.length; i++) {
        update.push(false);
    }

    for (let i = 0; i < arguments.length; i++) {
        update[arguments[i]] = true;
    }

    UpdatePluginParameters();
}

// Creates 8 Menus For tones
function createTone() {

    for (let i = 1; i <= tones; i++) {
        const tonTone = {name: i + toneName, type: "menu", defaultValue: 0, valueStrings: notes};
        const tonProb = {name: i + probName, type: "lin", defaultValue: 0, minValue: 0, maxValue: 100, numberOfSteps: 100000};
        probabilitySliders[PluginParameters.length + 1] = i + probName;

        PluginParameters.push(tonTone, tonProb);
    }
}