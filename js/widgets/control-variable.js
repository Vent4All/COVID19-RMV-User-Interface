"use strict"
import {clamp, pct, sanitizeString} from "../common/helpers.js";

/**
 * Control widget
 * 
 * @argument containerId
 * @argument value Will display '--' for non-number values.
 * @argument limits Array [min, max]
 */
export default (containerId, title, initialValue = 0, limits = [0, 100], prefix = "", postfix = "") => {
    let currentVal;
    const showLimits = limits.length === 2; 

    const containerEl = document.getElementById(containerId);

    const titleEl = document.createElement("div");
    titleEl.classList.add("control-title");
    const titleText = document.createElement("span");
    const valueEl = document.createElement("div");
    valueEl.classList.add("control-value");
    const valueText = document.createElement("span");

    containerEl.appendChild(titleEl);
    titleEl.appendChild(titleText);
    containerEl.appendChild(valueEl);
    valueEl.appendChild(valueText);

    // Set values    
    titleText.innerHTML  = sanitizeString(title);

    let meterBar;
    if (showLimits) {
        const limitsEl = document.createElement("div");
        limitsEl.classList.add("control-limits");
        const limitMin = document.createElement("span");
        limitMin.classList.add("control-limit-min");
        const limitMax = document.createElement("span");
        limitMax.classList.add("control-limit-max");
        const meterEl = document.createElement("div");
        meterEl.classList.add("control-meter");
        meterBar = document.createElement("span");

        containerEl.appendChild(limitsEl);
        limitsEl.appendChild(limitMin);
        limitsEl.appendChild(limitMax);
        containerEl.appendChild(meterEl);
        meterEl.appendChild(meterBar);

        // Set values    
        limitMin.textContent = limits[0];
        limitMax.textContent = limits[1];
    }

    const setValue = (val) => {
        if (val === currentVal) {
            return;
        }        
        if (valueText) {
            valueText.textContent = sanitizeString(`${prefix}${val}${postfix}`);
        }        
        if (showLimits && meterBar) {
            meterBar.style.width = `${clamp(pct(val, limits[0], limits[1]), 0, 100)}%`;
        }
        currentVal = val;
    };
    setValue(initialValue);

    return {
        setValue,
        destroy: () => {
            containerEl.innerHTML = "";
        },
        select: (doSelect) => {
            if (doSelect) {
                containerEl.classList.add("active-setting");
            }
            else {
                containerEl.classList.remove("active-setting");
            }
        }
    }
};