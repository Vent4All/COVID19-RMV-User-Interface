"use strict"
import { scale, isEqualWithinThreshold } from "../common/helpers.js";

/**
 * Todo: 
 * - redraw upon window resize (store data)
 * - Compute second line offset correctly
 * - make drawing fps-invariant
 */

/**
 * Chart instance
 * @param {*} containerId 
 * @param {*} title 
 * @param {*} color 
 * @param {*} timeWindow in seconds
 * @param {*} yMin 
 * @param {*} yMax 
 * @param {*} moverLength in seconds
 */
const chart = (containerId, title, color = { r: 0.8, g: 0.2, b: 0.2, a: 1 }, timeWindow = 12, yMin = 0, yMax = 255, moverLength = 0.3, updateFrequency = 60) => {
    //------------------------1. PREPARATION------------------------//
    //-----------------------------SVG------------------------------// 
    // create elements (svg container, canvas, mover)
    const containerEl = document.getElementById(containerId);
    const svgContainer = document.createElement("div");
    const canvasEl = document.createElement("canvas");
    const moverEl = document.createElement("div");

    svgContainer.classList.add("svg-container");
    canvasEl.classList.add("canvas-chart");
    moverEl.classList.add("mover");

    containerEl.appendChild(svgContainer);
    containerEl.appendChild(canvasEl);
    containerEl.appendChild(moverEl);

    const margin = 0;
    const padding = 2;
    const adj = 25;
    const width = containerEl.clientWidth;
    const height = containerEl.clientHeight - 2 * adj;

    // Append SVG for axes drawing
    const svg = d3.select(svgContainer).append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "-"
            + adj * 1.5 + " -" // adjust for padding left
            + 0 + " "
            + (width + adj * 1.5) + " " // should be same value as padding left
            + (height + 20))
        .style("padding", padding)
        .style("margin", margin)
        .classed("svg-content", true);

    //----------------------------SCALES----------------------------//
    const xScale = d3.scaleTime().range([0, width]);
    const yScale = d3.scaleLinear().rangeRound([height, 0]);

    //-----------------------------AXES-----------------------------//
    const yaxis = d3.axisLeft()
        .ticks(0)
        .scale(yScale);

    const xaxis = d3.axisBottom()
        .ticks(0)
        .scale(xScale);

    //-------------------------2. DRAWING---------------------------//
    //-----------------------------AXES-----------------------------//
    svg.append("g")
        .attr("class", "axis xaxis")
        .attr('id', 'xaxis')
        .attr("transform", "translate(0," + height + ")")
        .call(xaxis);

    const yaxisEl = svg.append("g")
        .attr("class", "axis yaxis")
        .attr('id', 'yaxis')
        .call(yaxis);

    const coords = () => ({
        xaxis: svg.select("g.xaxis").node().getBoundingClientRect(),
        yaxis: svg.select("g.yaxis").node().getBoundingClientRect(),
        mover: moverEl.getBoundingClientRect(),
        chart: canvasEl.getBoundingClientRect()
    });
    let elCoords = coords();

    yaxisEl.append("text")
        .attr("transform", "rotate(-90)")
        .attr("dy", ".75em")
        .attr("x", -1 * elCoords.yaxis.height / 2)
        .attr("y", -15)
        .style("text-anchor", "middle")
        .text(title);

    yaxisEl.append("text")
        .attr("dy", ".75em")
        .attr("x", -10)
        .attr("y", elCoords.yaxis.height)
        .style("text-anchor", "end")
        .attr("class", "yRangeValue-min")
        .text(yMin);

    yaxisEl.append("text")
        .attr("dy", ".75em")
        .attr("x", -10)
        .attr("y", 5)
        .style("text-anchor", "end")
        .attr("class", "yRangeValue-max")
        .text(yMax);

    // Setup mover    
    const numX = timeWindow * updateFrequency; // Number of datapoints

    elCoords = coords();
    const moverElWidth = (elCoords.xaxis.width / numX) * (moverLength * updateFrequency);
    moverEl.style.top = `${elCoords.yaxis.top}px`;
    moverEl.style.width = `${moverElWidth}px`;
    let glMoverHeight = elCoords.xaxis.bottom - elCoords.yaxis.top;
    moverEl.style.height = `${glMoverHeight}px`;

    // Setup webgl plot    
    canvasEl.style.top = `${elCoords.yaxis.top}px`;
    canvasEl.style.width = `${elCoords.xaxis.width}px`;
    let glChartHeight = elCoords.xaxis.top - elCoords.yaxis.top - 1;
    canvasEl.style.height = `${glChartHeight}px`;
    canvasEl.style.left = `${elCoords.yaxis.left + elCoords.yaxis.width + 1}px`;

    const lineColor = new webglplotBundle.ColorRGBA(color.r, color.g, color.b, color.a);
    const line = new webglplotBundle.WebglLine(lineColor, numX);
    const line2 = new webglplotBundle.WebglLine(lineColor, numX);
    const wglp = new webglplotBundle.WebGLplot(canvasEl, new webglplotBundle.ColorRGBA(1, 0.1, 0.1, 1));

    line.lineSpaceX(-1, 2 / numX);
    line2.lineSpaceX(-1, 2 / numX);
    wglp.addLine(line);
    wglp.addLine(line2);

    let yRange = yMax;

    const setLineValue = (i, val) => {
        if (i < line.numPoints) {
            line.setY(i, val);
            line2.setY(i, val + 0.02);
        }
    };

    const rescaleGraph = (oldRange, newRange) => {
        const factor = oldRange / newRange;
        for (let i = 0; i < line.numPoints; i++) {
            const oldVal = (line.getY(i) + 1) / 2;
            const newVal = scale(oldVal * factor, [0, 1], [-1, 1]);
            line.setY(i, newVal);
            line2.setY(i, newVal + 0.02);
        }
    }

    let t = 0;
    return {
        update(value) {
            const val = scale(value, [yMin, yRange], [-1, 1]);
            setLineValue(t, val);

            elCoords = coords();
            if (isEqualWithinThreshold(elCoords.yaxis.top, elCoords.mover.top)) {
                moverEl.style.top = `${elCoords.yaxis.top}px`;
                canvasEl.style.top = `${elCoords.yaxis.top}px`;
            }
            if (isEqualWithinThreshold(elCoords.chart.width, elCoords.xaxis.width)) {
                canvasEl.style.width = `${elCoords.xaxis.width}px`;
            }

            glChartHeight = elCoords.xaxis.top - elCoords.yaxis.top - 1;
            glMoverHeight = elCoords.xaxis.bottom - elCoords.yaxis.top;
            if (isEqualWithinThreshold(elCoords.mover.height, glMoverHeight) || isEqualWithinThreshold(elCoords.chart.height, glChartHeight)) {
                moverEl.style.height = `${glMoverHeight}px`;
                canvasEl.style.height = `${glChartHeight}px`;
            }
            if (isEqualWithinThreshold(elCoords.chart.left, elCoords.yaxis.left + elCoords.yaxis.width + 1)) {
                canvasEl.style.left = `${elCoords.yaxis.left + elCoords.yaxis.width + 1}px`;
            }

            // Update mover 
            const moverElWidthNew = (elCoords.xaxis.width / numX) * (moverLength * updateFrequency);
            if (isEqualWithinThreshold(elCoords.mover.width, moverElWidthNew)) {
                moverEl.style.width = `${moverElWidthNew}px`;
            }
            const span = elCoords.xaxis.width;
            const yOffset = (t / line.numPoints) * span - 2;
            const moverElLeft = elCoords.yaxis.left + elCoords.yaxis.width + yOffset;
            moverEl.style.left = `${moverElLeft}px`;

            // prevent overflow of the mover onto the right side
            if (moverElLeft > elCoords.xaxis.width + elCoords.xaxis.left - elCoords.yaxis.width) {
                const newWidth = elCoords.yaxis.width + ((elCoords.xaxis.width + elCoords.xaxis.left - elCoords.yaxis.width) - moverElLeft);
                moverEl.style.width = `${newWidth}px`;
            }

            // Update time instant
            t = (t + 1) % line.numPoints;
        },
        setYRange: (newRange) => {
            if (yRange !== newRange) {
                rescaleGraph(yRange, newRange);
                yRange = newRange;
                yaxisEl.select('.yRangeValue-max').text(newRange);
            }            
        },
        /**
         * Call this from a requestAnimationFrame callback
         */
        updatePlot() {
            wglp.update();
        }
    }
}
export default chart;
