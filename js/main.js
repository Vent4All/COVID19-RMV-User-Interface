"use strict"
console.log("Hello there!");
import Chart from './chart.js';
import ControlWidget from './control-widget.js';

// Create websocket
const wsSocket = new WebSocket("ws://192.168.178.103:6789");

wsSocket.onopen = function (event) {
    console.log("Connection to controller established.");
};

/**
 * Data from controller: 
 * uint8: [err, state main, state sub, setting_idx, ...]
 * uint8: [err, state main, state sub, setting_idx, ...]
 * 
 * Data to UI
 */
$(document).ready(function() {
    const valuesEl = document.getElementById("values");
    const tvCW = ControlWidget('cw1','Tidal Volume', 300, [200, 800], '',' mL');
    const fiCW = ControlWidget('cw2','FiO2', 21, [21, 100], '', '%');
    const peCW = ControlWidget('cw3','PEEP', 5, [0, 25], '',' mL');
    const brCW = ControlWidget('cw4','Breathing Rate', 12, [10, 30], '', ' Bpm');    
    const ieCW = ControlWidget('cw5','I:E', 2, [1, 3], '1:', '');

    const pChart = Chart("pchart", "Pressure (cmH2O)", { r: 1, g: 0.4, b: 0, a: 1});
    const fChart = Chart("fchart", "Flow (sccm)", { r: 0.4, g: 1, b: 0, a: 1});
    const vChart = Chart("vchart", "Volume (mL)", { r: 0, g: 0.4, b: 1, a: 1});
    pChart.setYRange(80);

    wsSocket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        if (valuesEl) {
            valuesEl.textContent=data.value.toString();
        }        
        pChart.update(data.value[0]);
        fChart.update(data.value[0]);
        vChart.update(data.value[0]);
    }    

    let tv = 0;
    function newFrame() {
        // Controls
        tvCW.setValue(tv+200);
        tv = ++tv % (800-200);

        // Charts
        pChart.updatePlot();
        fChart.updatePlot();
        vChart.updatePlot();

        window.requestAnimationFrame(newFrame);
      }
      window.requestAnimationFrame(newFrame);
});





