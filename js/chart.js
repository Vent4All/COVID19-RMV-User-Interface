"use strict"

/**
 * Todo: 
 * - redraw upon window resize (store data)
 * - Compute second line offset correctly
 * - Commpute yaxis label location 
 */
export default (containerId, title, color = {r: 0.8, g: 0.2, b: 0.2, a: 1}, timeWindow = 12) => {
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
    const height = containerEl.clientHeight - 2*adj;


    // Append SVG for axes drawing
    const svg = d3.select(svgContainer).append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "-"
            + adj + " -"
            + 0 + " "
            + (width + adj) + " "
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

    yaxisEl.append("text")
        .attr("transform", "rotate(-90)")
        .attr("dy", ".75em")
        .attr("x", -70)
        .attr("y", -15)
        .style("text-anchor", "middle")
        .text(title);

    yaxisEl.append("text")
        .attr("dy", ".75em")
        .attr("x", -5)
        .attr("y", 10)
        .style("text-anchor", "end")
        .attr("class", "yRangeValue")
        .text("100");

    // Setup mover    
    const coords = () => ({
        xaxis: svg.select("g.xaxis").node().getBoundingClientRect(),
        yaxis: svg.select("g.yaxis").node().getBoundingClientRect(),
        mover: moverEl.getBoundingClientRect(),
        chart: canvasEl.getBoundingClientRect()
    });
    let elCoords = coords();

    const updateFrequency = 60; // fps
    const numX = timeWindow * updateFrequency; // Number of datapoints

    const moverLength = 0.3; // seconds
    const moverElWidth = (elCoords.xaxis.width / numX) * (moverLength * updateFrequency);    
    moverEl.style.top = `${elCoords.yaxis.top}px`;
    moverEl.style.width = `${moverElWidth}px`;
    moverEl.style.height = `${elCoords.yaxis.height}px`;

    // Setup webgl plot    
    canvasEl.style.top = `${elCoords.yaxis.top}px`;
    canvasEl.style.width = `${elCoords.xaxis.width}px`;
    canvasEl.style.height = `${elCoords.yaxis.height - 1}px`;
    canvasEl.style.left = `${elCoords.yaxis.left + elCoords.yaxis.width + 1}px`;

    
    const lineColor = new webglplotBundle.ColorRGBA(color.r, color.g, color.b, color.a);    
    const line = new webglplotBundle.WebglLine(lineColor, numX);    
    const line2 = new webglplotBundle.WebglLine(lineColor, numX);   
    const wglp = new webglplotBundle.WebGLplot(canvasEl, new webglplotBundle.ColorRGBA(1,0.1,0.1,1) );
    
    line.lineSpaceX(-1, 2 / numX);
    line2.lineSpaceX(-1, 2 / numX);
    wglp.addLine(line);
    wglp.addLine(line2);

    const setLineValue = (i, val) => {
        if (i < line.numPoints) {
            line.setY(i,val);
            line2.setY(i,val + 0.02);
        }
    };
    const scale = (inputY, yRange, xRange) => {
        const [xMin, xMax] = xRange;
        const [yMin, yMax] = yRange;
        
        const percent = (inputY - yMin) / (yMax - yMin);
        const outputX = percent * (xMax - xMin) + xMin;
        
        return outputX;
    };
    const isEqual = (a, b) => {
        return Math.abs(a - b) > 0.5;
    }

    const yPMin = 0;
    const yPMax = 255;
    let t = 0;
    return {
        update(value) {        
            const val = scale(value, [yPMin, yPMax],[-1, 1])
            setLineValue(t, val);

            elCoords = coords();
            if (isEqual(elCoords.yaxis.top, elCoords.mover.top)) {
                moverEl.style.top = `${elCoords.yaxis.top}px`;
                canvasEl.style.top = `${elCoords.yaxis.top}px`;
            }          
            if (isEqual(elCoords.chart.width, elCoords.xaxis.width)) {
                canvasEl.style.width = `${elCoords.xaxis.width}px`;
            }
            if (isEqual(elCoords.mover.height, elCoords.yaxis.height + 3) || isEqual(elCoords.chart.height, elCoords.yaxis.height - 1)) {
                moverEl.style.height = `${elCoords.yaxis.height + 3}px`;
                canvasEl.style.height = `${elCoords.yaxis.height - 1}px`;
            }      
            if (isEqual(elCoords.chart.left, elCoords.yaxis.left + elCoords.yaxis.width + 1)) {
                canvasEl.style.left = `${elCoords.yaxis.left + elCoords.yaxis.width + 1}px`;
            }           

            // Update mover 
            const moverElWidthNew = (elCoords.xaxis.width / numX) * (moverLength * updateFrequency);
            if (isEqual(elCoords.mover.width, moverElWidthNew)) {
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
            t = (t+1) % line.numPoints;
        },
        setYRange: (value) => {
            svg.select('text.yRangeValue').text(value);
        },
        /**
         * Call this from a requestAnimationFrame callback
         */
        updatePlot() {
            wglp.update();
        }
    }
}
