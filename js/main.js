"use strict"
import Chart from './widgets/chart.js';
import ControlWidget from './widgets/control-variable.js';
import { getQueryStringParameters, AnimationFrame } from './common/helpers.js';

// Create websocket
const wsURL = "ws://192.168.178.103:6789";
var wsSocket = new ReconnectingWebSocket(wsURL, null, { debug: false, reconnectInterval: 3000 });

wsSocket.onopen = function (event) {
    console.log("Connection to controller established.");
};
wsSocket.onclose = function (event) {
    console.log("Connection to controller lost.");
};

let data = {
    pressure: 0, // cmH2O
    flow: 0, // slm
    volume: 0, // ml
    selectedSetting: 0,
    raw: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    inspector: {
        valveIn: 0,
        valveOut: 0,
        pressureTarget: 0,
        flowTarget: 0,
        volumeTarget: 0
    },
    settings: {
        Vt: 200,
        FiO2: 21,
        PEEP: 0,
        RR: 10,
        IE: 1
    }
};

let average = (array) => array.reduce((a, b) => a + b) / array.length;
const flowvals = [0, 0, 0, 0, 0];
let flowIdx = 0;
wsSocket.onmessage = function (event) {
    try {
        const controllerData = JSON.parse(event.data).value;
        data.raw = controllerData;

        // States
        data.pressure = controllerData[7] / 100.0;
        const flowValue = controllerData[8] / 100.0;
        flowvals[flowIdx] = controllerData[8] / 100.0;
        flowIdx = (flowIdx + 1) % flowvals.length;
        data.flow = flowValue < 0.1 ? flowValue : average(flowvals);
        data.volume = controllerData[9] / 10.0;

        // Inspector
        const inspectionIdx = controllerData[5];
        const inspectionValue = controllerData[6];
        switch (inspectionIdx) {
            case 1: {
                data.inspector.valveIn = Math.round(inspectionValue);
                break;
            }
            case 2: {
                data.inspector.valveOut = Math.round(inspectionValue);
                break;
            }
            case 3: {
                data.inspector.pressureTarget = Math.round(inspectionValue / 10);
                break;
            }
            case 4: {
                data.inspector.flowTarget = Math.round(inspectionValue / 10);
                break;
            }
            case 5: {
                data.inspector.volumeTarget = Math.round(inspectionValue / 10);
                break;
            }
        }

        // Settings
        const settingIdx = controllerData[1];
        const settingValue = controllerData[2];
        data.selectedSetting = controllerData[3]; 
        switch (settingIdx) {
            case 1: {
                // VT
                data.settings.Vt = Math.round(settingValue * 50);
                break;
            }
            case 2: {
                // PEEP
                data.settings.PEEP = Math.round(settingValue);
                break;
            }
            case 3: {
                // FiO2
                data.settings.FiO2 = Math.round(settingValue);
                break;
            }
            case 4: {
                // RR
                data.settings.RR = Math.round(settingValue);
                break;
            }
            case 5: {
                // IE
                data.settings.IE = Math.round(settingValue);
                break;
            }
        }
    }
    catch (e) {
        console.log(e);
    }
}

// i.e. http://localhost:8080/?fps=60&showFPS=true
const queryParams = getQueryStringParameters();
$(document).ready(function () {
    const requestFPS = parseInt(queryParams.fps) || 60;
    const showFPS = queryParams.showFPS === "true" || false;

    const valuesEl = document.getElementById("values");
    const vmCW = ControlWidget('cw0', 'Mode', 'VC-CMV', [], '', '');
    const tvCW = ControlWidget('cw1', 'V<sub>T</sub>', 0, [200, 800], '', ' mL');    
    const peCW = ControlWidget('cw2', 'PEEP', 0, [0, 25], '', ' cmH2O');
    const fiCW = ControlWidget('cw3', 'FiO<sub>2</sub>', 0, [21, 100], '', '%');
    const brCW = ControlWidget('cw4', 'RR', 0, [10, 30], '', ' Bpm');
    const ieCW = ControlWidget('cw5', 'I:E', 0, [1, 3], '1:', '');

    const timeWindow = 12;
    const moverLength = 0.2;
    const pChart = Chart("pchart", "Pressure (cmH2O)", { r: 1, g: 0.4, b: 0, a: 1 }, timeWindow, 0, 30, 5, moverLength, requestFPS, false);
    const fChart = Chart("fchart", "Flow (slm)", { r: 0.4, g: 1, b: 0, a: 1 }, timeWindow, 0, 25, 5, moverLength, requestFPS, false);
    const vChart = Chart("vchart", "Volume (mL)", { r: 0, g: 0.4, b: 1, a: 1 }, timeWindow, 0, 400, 50, moverLength, requestFPS, false);

    document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
            // Just became visible again
            // Reset the graphs, as visualization is not reliable anymore.
            pChart.reset();
            fChart.reset();
            vChart.reset();
        }
    });

    function newFrame() {
        if (document.hidden) {
            return;
        }

        // Set debug values string
        if (valuesEl) {
            valuesEl.innerHTML = `uint8 [${data.raw.slice(0, 6)}]. 
                <br> uint16: [${data.raw.slice(6, 10)}]
                <br> valveIn: ${data.inspector.valveIn}, valveOut: ${data.inspector.valveOut}
                <br> pressureTarget: ${data.inspector.pressureTarget}, flowTarget: ${data.inspector.flowTarget}, volumeTarget: ${data.inspector.volumeTarget}
            `;
        }

        // Controls
        tvCW.setValue(data.settings.Vt);
        peCW.setValue(data.settings.PEEP);
        fiCW.setValue(data.settings.FiO2);
        brCW.setValue(data.settings.RR);
        ieCW.setValue(data.settings.IE);

        // Selection
        for (let i = 0; i < 6; i++) {
            tvCW.select(data.selectedSetting === 1);
            peCW.select(data.selectedSetting === 2);
            fiCW.select(data.selectedSetting === 3);
            brCW.select(data.selectedSetting === 4);
            ieCW.select(data.selectedSetting === 5);
        }

        // Set values
        pChart.update(data.pressure, data.inspector.pressureTarget);
        fChart.update(data.flow, data.inspector.flowTarget);
        vChart.update(data.volume, data.inspector.volumeTarget);

        // Charts
        pChart.updatePlot();
        fChart.updatePlot();
        vChart.updatePlot();
    }

    const af = new AnimationFrame(requestFPS, newFrame, showFPS);
    af.start();
});





