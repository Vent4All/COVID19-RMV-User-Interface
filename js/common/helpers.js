"use strict"

/**
 * Clamp
 * @param {*} nr 
 * @param {*} min 
 * @param {*} max 
 */
export const clamp = (nr, min, max) => Math.min(Math.max(nr, min), max);

/**
 * 
 * @param {*} a 
 * @param {*} b 
 */
export const isEqualWithinThreshold = (a, b, th = 0.5) => Math.abs(a - b) > th;

/**
 * 
 * @param {*} nr 
 * @param {*} min 
 * @param {*} max 
 */
export const pct = (nr, min, max) => ((nr - min) / (max - min)) * 100;

/**
 * 
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

export default  {
    clamp,
    isEqualWithinThreshold,
    pct,
    scale
}