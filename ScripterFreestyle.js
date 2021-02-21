function HandleMIDI(event) {
    event.trace();
    event.send();
}

function ParameterChanged(param, value) {
    if (!(updateList[param] === undefined || updateList[param] === true)) {
        updateList[param] = true;
        return;
    }

    let paramName = PluginParameters[param].name;
    Trace(paramName);
}

function toggleView() {
    resetUpdateList();

    for (let i = 0; i < arguments.length; i++) {
        PluginParameters[arguments[i]].hidden = !PluginParameters[arguments[i]].hidden;
        updateList[arguments[i]] = true;
    }
    UpdatePluginParameters();
}

function resetUpdateList() {
    updateList = [];
    for (let i = 0; i < PluginParameters.length; i++) {
        if (PluginParameters[i].type !== "momentary")
            updateList[i] = false;
    }
}

// Framework
PluginParameters = [
    {name: "Knopf", type:"momentary"},
    {name: "Menü", type: "menu", defaultValue: 0, valueStrings: ["Zufall", "Sequenz"]},
    {name: "Lin", type: "lin", defaultValue: 0, minValue: 0, maxValue: 100, numberOfSteps: 100},
    {name: "Log", type: "log", defaultValue: 1, minValue: 1, maxValue: 64, numberOfSteps: 6},
    {name: "Target", type:"target"}
];

let updateList = [];