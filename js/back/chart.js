"use strict"

export default (containerId, moverId) => {
    //------------------------1. PREPARATION------------------------//
    //-----------------------------SVG------------------------------// 
    const width = 840;
    const height = 500;
    const margin = 5;
    const padding = 0;
    const adj = 40;
    // we are appending SVG first
    const svg = d3.select(containerId).append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "-"
            + adj + " -"
            + adj + " "
            + (width + adj * 3) + " "
            + (height + adj * 3))
        .style("padding", padding)
        .style("margin", margin)
        .classed("svg-content", true);


    //-----------------------------DATA-----------------------------//
    const data = [];
    data.columns = ["time", "pressure"];
    const timeWindow = 12;
    const updateFrequency = 60;
    for (let i = 0; i < timeWindow * updateFrequency; i++) {
        data[i] = {
            time: i / updateFrequency,
            pressure: 0
        };
    }

    var slices = data.columns.slice(1).map(function (id) {
        return {
            id: id,
            values: data.map(function (d) {
                return {
                    time: d.time,
                    measurement: +d[id]
                };
            })
        };
    });
    console.log(slices);

    //----------------------------SCALES----------------------------//
    const xScale = d3.scaleTime().range([0, width]);
    const yScale = d3.scaleLinear().rangeRound([height, 0]);
    xScale.domain(d3.extent(data, function (d) {
        return d.time
    }));
    yScale.domain([(0), d3.max(slices, function (c) {
        return d3.max(c.values, function (d) {
            return d.measurement + 4;
        });
    })]);

    //-----------------------------AXES-----------------------------//
    const yaxis = d3.axisLeft()
        .ticks(0)
        .scale(yScale);

    const xaxis = d3.axisBottom()
        .ticks(0)
        .scale(xScale);

    //----------------------------LINES-----------------------------//
    // const line = d3.line()
    //     .x(function (d) { return xScale(d.time); })
    //     .y(function (d) { return yScale(d.measurement); });

    // let id = 0;
    // const ids = function () {
    //     return "line-" + id++;
    // }
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
        .attr("x", -150)
        .attr("y", -25)
        .style("text-anchor", "end")
        .text("Pressure (cmH2O)");

    yaxisEl.append("text")
        .attr("dy", ".75em")
        .attr("x", -10)
        .attr("y", 10)
        .style("text-anchor", "end")
        .text("50");

    /*
    //----------------------------LINES-----------------------------//
    const lines = svg.selectAll("lines")
        .data(slices)
        .enter()
        .append("g");

    lines.append("path")
        .attr("class", ids)
        .attr("d", function (d) { return line(d.values); });
*/
    const moverEl = document.getElementById(moverId);

    const coords = () => ({
        xaxis: document.getElementById("xaxis").getBoundingClientRect(),
        yaxis: document.getElementById("yaxis").getBoundingClientRect()
    });

    let axisCoords = coords();
    const leftEl = axisCoords.yaxis.left + axisCoords.yaxis.width;
    moverEl.style.top = `${axisCoords.yaxis.top}px`;
    moverEl.style.width = `${axisCoords.yaxis.width}px`;
    moverEl.style.height = `${axisCoords.yaxis.height + 50}px`;

    // Setup webgl plot
    const canv = document.getElementById("pchart");
    canv.style.top = `${axisCoords.yaxis.top + 23}px`;
    canv.style.width = `${axisCoords.xaxis.width}px`;
    canv.style.height = `${axisCoords.yaxis.height}px`;
    //canv.width = axisCoords.xaxis.width;
    //canv.height = axisCoords.yaxis.height;
    canv.style.left = `${axisCoords.yaxis.left + axisCoords.yaxis.width}px`;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const numX = Math.round(canv.clientWidth * devicePixelRatio);
    
    const color = new webglplotBundle.ColorRGBA(0.8, 0.2, 0.2, 1);    
    const line = new webglplotBundle.WebglLine(color, numX);    
    const line2 = new webglplotBundle.WebglLine(color, numX);   
    const wglp = new webglplotBundle.WebGLplot(canv, new webglplotBundle.ColorRGBA(0.1,0.1,0.1,1) );
    
    line.lineSpaceX(-1, 2 / numX);
    line2.lineSpaceX(-1, 2 / numX);
    wglp.addLine(line);
    wglp.addLine(line2);
    
    function newFrame() {
      // update();
      wglp.update();
      //wglp.gScaleY = scaleY;
      window.requestAnimationFrame(newFrame);
    }
    window.requestAnimationFrame(newFrame);

    const scale = (inputY, yRange, xRange) => {
        const [xMin, xMax] = xRange;
        const [yMin, yMax] = yRange;
        
        const percent = (inputY - yMin) / (yMax - yMin);
        const outputX = percent * (xMax - xMin) + xMin;
        
        return outputX;
    };

    const yPMin = 0;
    const yPMax = 255;
    let t = 0;
    return {
        update(pressure) {
            // Update data            
            // slices[0].values[t].measurement = pressure;
            const val = scale(pressure, [yPMin, yPMax],[-1, 1])
            line.setY(t,val);
            line2.setY(t,val + 0.02);

            /*// update y-axis domain
            yScale.domain([(0), d3.max(slices, function (c) {
                return d3.max(c.values, function (d) {
                    return d.measurement + 4;
                });
            })]);

            // Update line
            svg.select(".line-0")   // change the line
            .attr("d",  function (d) { return line(d.values); });
            svg.select(".yaxis") // change the y axis
                .call(yaxis);
            */

            // const freq = 0.001;
            // const amp = 0.5;
            // const noise = 0.1;

            // for (let i = 0; i < line.numPoints; i++) {
            //     const ySin = Math.sin(Math.PI * i * freq * Math.PI * 2);
            //     const yNoise = Math.random() - 0.5;
            //     line.setY(i, ySin * amp + yNoise * noise);
            // }

            // Update mover
            axisCoords = coords();
            const span = axisCoords.xaxis.width;
            // const yOffset = (t / (timeWindow * updateFrequency)) * span - 1;
            const yOffset = (t / line.numPoints) * span - 1;
            moverEl.style.left = `${leftEl + yOffset}px`;

            // Update time instant
            //t = (t + 1) % (timeWindow * updateFrequency);
            t = (t+1) % line.numPoints;
        }
    }
}
