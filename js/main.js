"use strict"
import Chart from './widgets/chart.js';
import ControlWidget from './widgets/control-variable.js';
import { getQueryStringParameters, AnimationFrame } from './common/helpers.js';

// Create websocket
const wsURL = "ws://192.168.178.103:6789";
var wsSocket = new ReconnectingWebSocket(wsURL, null, {debug: false, reconnectInterval: 3000});

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
    raw: [0,0,0,0,0,0,0,0,0,0],
    settings: {
        Vt: 200,
        FiO2: 21,
        PEEP: 0,
        RR: 10,
        IE: 1
    } 
};
wsSocket.onmessage = function (event) {
    try {
        const controllerData = JSON.parse(event.data).value;
        data.raw = controllerData;
        
        // States
        data.pressure = controllerData[6] / 100.0;
        data.flow = controllerData[7] / 100.0;
        data.volume = controllerData[8] / 10.0;

        // Settings
        const settingIdx = controllerData[1];
        const settingValue = controllerData[2];
        switch (settingIdx) {
            case 0: {
                // VT
                data.settings.Vt = Math.round(settingValue * 50);
                break;
            }
            case 1: {
                // PEEP
                data.settings.PEEP = Math.round(settingValue);
                break;
            }
            case 2: {
                // FiO2
                data.settings.FiO2 = Math.round(settingValue);
                break;
            }
            case 3: {
                // RR
                data.settings.RR = Math.round(settingValue);
                break;
            }
            case 4: {
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
    const fiCW = ControlWidget('cw2', 'FiO<sub>2</sub>', 0, [21, 100], '', '%');
    const peCW = ControlWidget('cw3', 'PEEP', 0, [0, 25], '', ' cmH2O');
    const brCW = ControlWidget('cw4', 'RR', 0, [10, 30], '', ' Bpm');
    const ieCW = ControlWidget('cw5', 'I:E', 0, [1, 3], '1:', '');

    const timeWindow = 12;
    const moverLength = 0.3;
    const pChart = Chart("pchart", "Pressure (cmH2O)", { r: 1, g: 0.4, b: 0, a: 1 }, timeWindow, 0, 80, moverLength, requestFPS);
    const fChart = Chart("fchart", "Flow (slm)", { r: 0.4, g: 1, b: 0, a: 1 }, timeWindow, 0, 20, moverLength, requestFPS);
    const vChart = Chart("vchart", "Volume (mL)", { r: 0, g: 0.4, b: 1, a: 1 }, timeWindow, 0, 250, moverLength, requestFPS);

    function newFrame() {
        // Set debug values string
        if (valuesEl) {
            valuesEl.textContent = data.raw.toString();
        }
        
        // Controls
        tvCW.setValue(data.settings.Vt);
        peCW.setValue(data.settings.PEEP);
        fiCW.setValue(data.settings.FiO2);
        brCW.setValue(data.settings.RR);
        ieCW.setValue(data.settings.IE);
        
        // Check chart ranges
        vChart.setYRange(Math.round(data.settings.Vt + 50));

        // Set values
        pChart.update(data.pressure);
        fChart.update(data.flow);
        vChart.update(data.volume);

        // Charts
        pChart.updatePlot();
        fChart.updatePlot();
        vChart.updatePlot();
    }

    const af = new AnimationFrame(requestFPS, newFrame, showFPS);
    af.start();  
});





