"use strict"
/**
 * AnimationFrame
 * Limit the update frequency. Especially useful on resource-constrained clients like a Raspberry Pi.
 * Based on: https://gist.github.com/addyosmani/5434533
 */
export class AnimationFrame {
    constructor(fps = 60, animate, showFPS = false) {
        this.requestID = 0;
        this.fps = fps;
        this.animate = animate;
        this.showFPS = showFPS;

        if (this.showFPS) {
            this.fpsEl = document.createElement("div");
            this.fpsEl.classList.add("fps-counter");
            document.body.appendChild(this.fpsEl);
        }
    }

    start() {
        let then = performance.now();
        let prevFrame = performance.now();
        const interval = 1000 / this.fps;
        const tolerance = 0.1;

        // Circular buffer
        const fpsBuffer = new Array(10);
        fpsBuffer.forEach((val, idx, arr) => arr[idx] = 0);
        let fpsIdx = 0;
        const animateLoop = (now) => {
            this.requestID = requestAnimationFrame(animateLoop);
            const delta = now - then;

            if (delta >= interval - tolerance || this.fps >= 60) {
                then = now - (delta % interval);             

                if (this.showFPS) {
                    fpsBuffer[fpsIdx] = now - prevFrame;
                    fpsIdx = (fpsIdx + 1) % fpsBuffer.length;
                    this.updateFPSCounter(
                        Math.round(1000 / (fpsBuffer.reduce((total, val) => val + total) / fpsBuffer.length))
                    )
                    prevFrame = now;
                }

                this.animate(delta);

                
            }
        };
        this.requestID = requestAnimationFrame(animateLoop);
    }

    updateFPSCounter(fps) {
        this.fpsEl.textContent = fps;
    }

    stop() {
        cancelAnimationFrame(this.requestID);
    }
}

/**
 * Clamp
 * @param {*} nr 
 * @param {*} min 
 * @param {*} max 
 */
export const clamp = (nr, min, max) => Math.min(Math.max(nr, min), max);

/** 
 * getQueryStringParameters
 * 
 * This ES6(ECMAScript) function getQueryStringParameters takes url  
 * as parmater and returns
 * parameters name and value in JSON key value format 
 * @parameter {String} url 
 * (if url is not passed it takes the current url from window.location.href) 
 * 
 **/
export const getQueryStringParameters = url => {
    let query;
    if (url){
      if(url.split("?").length>0){
      query = url.split("?")[1];
    }
    }else{
       url = window.location.href;
       query = window.location.search.substring(1);
    }
    return (/^[?#]/.test(query) ? query.slice(1) : query)
    .split('&')
    .reduce((params, param) => {
    let [ key, value ] = param.split('=');
    params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
    return params;
  }, { });
};

/**
 * isEqualWithinThreshold
 * @param {*} a 
 * @param {*} b 
 */
export const isEqualWithinThreshold = (a, b, th = 0.5) => Math.abs(a - b) > th;

/**
 * pct
 * @param {*} nr 
 * @param {*} min 
 * @param {*} max 
 */
export const pct = (nr, min, max) => ((nr - min) / (max - min)) * 100;


const htmlWhitelist = { 'sub' : {}};
/**
 * sanitizeString
 * Sanitazation for any innerHTML actions
 * @param {*} aString 
 */
export const sanitizeString = (aString) => FilterHTML.filter_html(aString, htmlWhitelist);

/**
 * scale
 * @param {*} inputY 
 * @param {*} yRange 
 * @param {*} xRange 
 */
export const scale = (inputY, yRange, xRange) => {
    const [xMin, xMax] = xRange;
    const [yMin, yMax] = yRange;

    const percent = (inputY - yMin) / (yMax - yMin);
    const outputX = percent * (xMax - xMin) + xMin;

    return outputX;
};

export default {
    AnimationFrame,
    clamp,
    getQueryStringParameters,
    isEqualWithinThreshold,
    pct,
    sanitizeString,
    scale
}