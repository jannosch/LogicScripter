/* # # # # # # # # # # # # # # # # #
 #                                 #
 # CoBot created by Jannis Müller  #
 #                                 #
 # # # # # # # # # # # # # # # # # */

/** ALL PARAMETER TYPES
 *
 *  {name: "...", type: "momentary", subParams: [parameter]}
 *  {name: "...", type: "menu", defaultValue: 0, valueStrings: ["..."]}
 *  {name: "...", type: "lin", unit: "...", defaultValue: 0, minValue: 0, maxValue: 100, numberOfSteps: 100},
 *  {name: "...", type: "log", unit: "...", defaultValue: 1, minValue: 1, maxValue: 64, numberOfSteps: 6},
 *  {name: "...", type: "target"}
 *  {name: "...", type: "note"} - Custom
 *  {name: "...", type: "expand", params: [parameter]} - Custom
 *
 *
 *  CUSTOM ATTRIBUTES
 *  listener: function(value)   Called whenever the Parameter is updated
 *  subParams: [parameter]      TYPE: MOMENTARY ONLY, all Objects toggled when clicked
 *  sub: boolean                Should it automatically be added under the menu-head. Just for initial creation
 *  onCreate: function()        Called when parameter is created
 */

// Syntax for Custom-Parameters:
//  {name: "", type: "momentary", subParams: [
//          {name: "", type: "", sub: true, listener: function(value) { }}
//      ]}

let outputNote, noteVon, noteBis, velocityVon, velocityBis;

// Called once on creation
function setup() {

    addParameter(outputNote = {name: "Output Note", type: "note"});
    addParameter(noteVon = {name: "Note von", type: "note"});
    addParameter(noteBis = {name: "Note bis", type: "note"});
    addParameter(velocityVon = {name: "Velocity von", type: "lin", defaultValue: 0, minValue: 0, maxValue: 127, numberOfSteps: 127});
    addParameter(velocityBis = {name: "Velocity bis", type: "lin", defaultValue: 127, minValue: 0, maxValue: 127, numberOfSteps: 127});
}

// Called for every MIDI event
function handleMIDI(event) {
    let valueNoteVon = getNoteParameter(noteVon);
    let valueNoteBis = getNoteParameter(noteBis);
    let valueVelocityVon = getParameter(velocityVon);
    let valueVelocityBis = getParameter(velocityBis);

    // Wenn Note extrem
    if (event.pitch <= valueNoteVon) {
        event.velocity = valueVelocityVon;

    } else if (event.pitch >= valueNoteBis) {
        event.velocity = valueVelocityBis;

    // Wenn Note im Bereich
    } else {
        event.velocity = (event.pitch - valueNoteVon) / (valueNoteBis - valueNoteVon) * (valueVelocityBis - valueVelocityVon) + valueVelocityVon;
    }

    // Wenn custom Note gesetzt
    if (getParameter(outputNote) > 1) {
        event.pitch = getNoteParameter(outputNote);
    }

    event.trace();
    event.send();

}

// Called for every cycle of Logic
function processMIDI(timingInfo) {

}

// Called when start playing
function startPlaying() {

}

// Called when stopped playing
function stopPlaying() {

}





//<editor-fold desc="DANDIS Framework">

/** METHOD PROVIDED BY FRAMEWORK
 *  Adds a Parameter to the Front-End
 *  Syntax for Custom-Parameters:
 *      {name: "", type: "momentary", subParams: [
 *          {name: "", type: "", sub: true, listener: function(value) { }}
 *      ]}
 *
 *  Menu-Headers:
 *      type: Has to be "momentary"
 *      subParams: Array of all sub Parameter-Objects
 *
 *  Menu-Children:
 *     type: Doesn't matter for children
 *     sub: Boolean if the parameter should be added directly below the menu-header
 *          If true parameter is added automatically
 *          If false parameter has to be added with addParameter(param) separately
 *
 *
 *  Note: Menu-Children can also be Menu-Headers for Sub-Menus
 **/
function addParameter(param, index) {

    // If type isn't expand
    if (param.type !== "expand") {

        // Add to PluginsParameters if needed with certain index
        if (index !== undefined) {
            PluginParameters.splice(index, 0, param);
        } else {
            PluginParameters.push(param);
        }

        // If parameter is possible menu-head
        if (param.type === "momentary") {
            // If parameter is menu-head
            if (param.subParams !== undefined) {

                // Adds menu-listener for every sub-parameter
                for (let i = 0; i < param.subParams.length; i++) {
                    let subParam = param.subParams[i];

                    addMenuListener(param, subParam);

                    // If parameter is located right below menu-head
                    if (subParam.sub === true) {
                        addParameter(subParam);
                    }
                }
            }

            // If parameter is Menu
        } else if (param.type === "menu") {
            if (param.defaultValue === undefined) {
                param.defaultValue = 0;
            }


            if (param.subParams !== undefined) {

                // Adds menu-listener for every sub-parameter for every state
                for (let v = 0; v < param.subParams.length; v++) {
                    if (param.subParams[v] !== undefined) {
                        for (let i = 0; i < param.subParams[v].length; i++) {
                            let subParam = param.subParams[v][i];
                            addMenuListener(param, subParam, v);

                            // If parameter is located right below menu-head
                            if (subParam.sub === true) {
                                addParameter(subParam);
                            }
                        }
                    }
                }
            }

            // If parameter is note
        } else if (param.type === "note") {
            param.type = "menu";
            param.customType = "note";
            param.defaultValue = 0;
            param.valueStrings = notes;
        }

        // If parameter is expand
    } else {
        // Add to expanded Parameters Map
        expandParams.set(param.name, param);

        // Create Things for Parent Parameter
        param.copies = 1;
        param.copiedParams = [];
        if (param.hidden === undefined) {
            param.hidden = false;
        }

        // Edit children
        for (let i = 0; i < param.params.length; i++) {

            // Change Appearance
            param.params[i].originalName = param.params[i].name;
            param.params[i].name = param.params[i].name.replace("%", param.copies);
            param.params[i].hidden = param.hidden;

            // Add reference to bigger Object
            param.params[i].expand = param.name;

            // Add child parameter
            addParameter(param.params[i]);
        }
    }

    // If parameter is Sub-parameter
    if (param.sub === true) {
        setHidden(true, [param]);
    }

    // Calls on create if exists
    if (param.onCreate !== undefined) {
        param.onCreate();
    }
}


/** FUNCTION USED BY FRAMEWORK
 *  Called every time when an expanded Parameter is touched
 *  Expands or Collapses parameter if needed
 **/
function expandParameter(paramObject) {
    let param = expandParams.get(paramObject.expand);

    // If parameter number is last maybe copy
    if ((param.copies === 1) || (param.copies > 1 && param.copies === getCopyNumber(paramObject) + 1)) {
        // If parameter values are correct to expand
        if (!isDefault(paramObject)) {
            // Copying
            let copy = JSON.parse(JSON.stringify(param.params));
            let copyIndex = PluginParameters.indexOf(param.params[0]) + param.params.length * param.copies;
            param.copiedParams.push(copy);
            param.copies++;

            // Prepare Parameter Update
            resetUpdateList();

            // Update Copy names and add them
            for (let i = 0; i < copy.length; i++) {
                copy[i].name = copy[i].originalName.replace("%", param.copies);
                addParameter(copy[i], copyIndex);
                updateList[copyIndex] = true;
                copyIndex++;
            }

            // Update Parameters
            UpdatePluginParameters();
        }

        // If parameter number is second last maybe delete
    } else if (param.copies > 1 && param.copies - 1 === getCopyNumber(paramObject) + 1) {
        // If parameter values are default to delete
        if (isDefault(paramObject)) {

            // Subtract from copy counter
            let remove = param.copiedParams[param.copies - 2];
            let removeIndex = PluginParameters.indexOf(remove[0]);
            param.copies--;

            // Delete
            PluginParameters.splice(removeIndex, remove.length);
            param.copiedParams.splice(param.copiedParams.length - 1, 1);

            // Parameter Update
            resetUpdateList();
            UpdatePluginParameters();

            // Is next parameter normal as well
            if (param.copiedParams.length > 1) {
                if (isDefault(param.copiedParams[param.copiedParams.length - 2][0])) {
                    expandParameter(param.copiedParams[param.copiedParams.length - 2][0]);
                }
            } else if (param.copiedParams.length === 1) {
                if (isDefault(param.params[0])) {
                    expandParameter(param.params[0]);
                }
            }
        }
    }
}


/** METHOD USED/PROVIDED BY FRAMEWORK
 *  Returns the copy number of parameter object
 **/
function getCopyNumber(paramObject) {
    if (paramObject.expand !== undefined) {
        let param = expandParams.get(paramObject.expand);

        if (param.params.includes(paramObject)) {
            return 0;
        } else {
            for (let i = 0; i < param.copiedParams.length; i++) {
                if (param.copiedParams[i].includes(paramObject)) {
                    return i + 1;
                }
            }
        }
    }
}


function isDefault(paramObject) {
    // If momentary always default
    if (paramObject.type === "momentary") {
        return true;
    } else if (paramObject.expand !== undefined) {
        let copy = getCopyNumber(paramObject);
        let expanded = expandParams.get(paramObject.expand);
        if (copy === 0) {
            for (let i = 0; i < expanded.params.length; i++) {
                if (GetParameter(PluginParameters.indexOf(expanded.params[i])) !== expanded.params[i].defaultValue) return false;
            }
        } else {
            for (let i = 0; i < expanded.copiedParams[copy - 1].length; i++) {
                if (GetParameter(PluginParameters.indexOf(expanded.copiedParams[copy - 1][i])) !== expanded.copiedParams[copy - 1][i].defaultValue) return false;
            }
        }
        return true;

    } else {
        return GetParameter(PluginParameters.indexOf(paramObject)) === paramObject.defaultValue;
    }
}


/** METHOD PROVIDED BY FRAMEWORK
 *  get a parameter Value from Object
 **/
function getParameter(paramObject) {
    return GetParameter(PluginParameters.indexOf(paramObject));
}


/** METHOD PROVIDED BY FRAMEWORK
 *  Returns the Midi-note of a note Parameter
 */
function getNoteParameter(paramObject) {
    return MIDI.noteNumber(notes[getParameter(paramObject)]);
}

/** METHOD PROVIDED BY FRAMEWORK
 * Toggles View of Parameters and all SubParameters
 * Input can be numbers mixed with objects
 * Visible or Hidden depends on first parameter
 * All Parameters will result in one visibility-state
 **/
function toggleVisible(params) {
    let boolean;
    if (params[0] instanceof Number) {
        boolean = !PluginParameters[params[0]].hidden;
    } else {
        boolean = !params[0].hidden;
    }

    setHidden(boolean, params);
}


/** METHOD PROVIDED BY FRAMEWORK
 * Sets View of Parameters to certain Values
 * Input can be numbers mixed with objects
 **/
function setHidden(boolean, params) {
    if (params === undefined) return;
    resetUpdateList();
    for (let i = 0; i < params.length; i++) {
        let paramObject;
        if (params[i] instanceof Number) {
            paramObject = PluginParameters[params[i]];
        } else {
            paramObject = params[i];
        }

        // If normal Parameter
        if (paramObject.type !== "expand") {

            paramObject.hidden = boolean;
            updateList[PluginParameters.indexOf(paramObject[i])] = true;

            // If Object is Menu-Header and gets hidden
            // Recursively hide all Sub-parameters
            if (boolean === true && paramObject.subParams !== undefined) {
                setHidden(true, paramObject.subParams);
            }

            // If expand parameter
        } else {
            for (let j = 0; j < paramObject.params.length; j++) {
                paramObject.params[j].hidden = boolean;
            }
            for (let j = 0; j < paramObject.copiedParams.length; j++) {
                for (let k = 0; k < paramObject.copiedParams[j].length; k++) {
                    paramObject.copiedParams[j][k].hidden = boolean;
                }
            }
        }
    }

    UpdatePluginParameters();
}

/** METHOD USED BY FRAMEWORK
 * Learn Tone if has to be learned
 * Passes event to handleMidi(event)
 * USE INSTEAD: function handleMidi(event)
 */
function HandleMIDI(event) {
    if (learnNote !== undefined) {
        // Have to learn next Note
        if (event instanceof NoteOn) {
            Trace("lerne: " + MIDI.noteName(event.pitch));
            SetParameter(learnNote, notes.indexOf(MIDI.noteName(event.pitch)));
            learnNote = undefined;
        }
    }

    handleMIDI(event);
}


function ProcessMIDI() {
    let timingInfo = GetTimingInfo();

    if (timingInfo.playing !== playing) {
        playing = timingInfo.playing;
        if (playing === true) {
            startPlaying();
        } else {
            stopPlaying();
        }
    }

    processMIDI(timingInfo);
}

/** METHOD USED BY FRAMEWORK
 * Official Method called on every ParameterChanged
 * It isn't recommended to use this Method
 * USE INSTEAD: "listener: function(value) {}" in parameter-object
 **/
function ParameterChanged(param, value) {
    // Handle updates
    if (!(updateList[param] === undefined || updateList[param] === true)) {
        updateList[param] = true;
        return;
    }

    let paramObject = PluginParameters[param];

    Trace("ParameterChanged: " + paramObject.name + ", value: " + value);

    // Runs MenuListener if existing
    if (menuListener[param] !== undefined) {
        if (paramObject.type === "momentary") {
            toggleVisible(menuListener[param]);
        } else {
            setHidden(true, menuListener[param][paramObject.lastIndex]);
            setHidden(false, menuListener[param][value]);
            paramObject.lastIndex = value;
        }
    }

    // If Note learning is selected
    if (paramObject.customType === "note") {
        if (value === 1) {

            // Clear old learnNote if still active
            if (learnNote !== undefined) {
                SetParameter(learnNote, 0);
            }

            // Set next learning Note to this Parameter
            learnNote = param;
            SetParameter(learnNote, 1);
        }
    }

    // Runs Internal Listener if existing
    if (PluginParameters[param].listener !== undefined) {
        PluginParameters[param].listener(value);
    }

    // Creates and Deletes of itself if can
    if (paramObject.expand !== undefined) {
        expandParameter(paramObject);
    }


}


/** METHOD USED BY FRAMEWORK
 *  Adds the subParameter to the menuListener-array
 **/
function addMenuListener(param, subParam, onIndex) {
    // If MenuListener of momentary
    if (onIndex === undefined) {
        if (menuListener[PluginParameters.indexOf(param)] === undefined) {
            menuListener[PluginParameters.indexOf(param)] = [subParam];
        } else {
            menuListener[PluginParameters.indexOf(param)].push(subParam);
        }

        // If MenuListener of menu
    } else {
        // If First MenuListener of Parameter
        if (menuListener[PluginParameters.indexOf(param)] === undefined) {
            menuListener[PluginParameters.indexOf(param)] = [];
        }

        if (param.lastIndex === undefined) {
            param.lastIndex = param.defaultValue;
        }

        if (menuListener[PluginParameters.indexOf(param)][onIndex] === undefined) {
            menuListener[PluginParameters.indexOf(param)][onIndex] = [subParam];
        } else {
            menuListener[PluginParameters.indexOf(param)][onIndex].push(subParam);
        }
        JSON.stringify("Array: " + menuListener[PluginParameters.indexOf(param)]);
    }
}


/** METHOD USED BY FRAMEWORK
 * Called when just certain Parameters are changed
 * Cancels next Update for every Parameter
 * Can be changed back to true manually for certain parameter
 **/
function resetUpdateList() {
    updateList = [];
    for (let i = 0; i < PluginParameters.length; i++) {
        if (PluginParameters[i].type !== "momentary")
            updateList[i] = false;
    }
}


/** VARIABLES USED BY FRAMEWORK **/
var PluginParameters = [];          // manual way to add Parameters USE INSTEAD: function addParameter(param)
var NeedsTimingInfo = true;         // always get timing info
let updateList = [];                // Array for the Parameter-indexes which should (not) be changed on next update
let menuListener = [];              // Contains all subMenu-Objects for every Parameter-number
let learnNote;                      // Index of Parameter which learns MIDI-Note
let playing;                        // Boolean if track is playing right now
let expandParams = new Map();       // String -> Parameter for all expanded Parameters

let notes = ["leer", "lernen",  // Every single option for the note-parameter
    "C2", "C#2", "D2", "D#2", "E2", "F2", "F#2", "G2", "G#2", "A2", "A#2", "B2",
    "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3",
    "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
    "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5",
    "C1", "C#1", "D1", "D#1", "E1", "F1", "F#1", "G1", "G#1", "A1", "A#1", "B1",
    "C0", "C#0", "D0", "D#0", "E0", "F0", "F#0", "G0", "G#0", "A0", "A#0", "B0"
];


setup();
//</editor-fold>