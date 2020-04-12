/**
 * Control widget
 * 
 * @argument containerId
 * @argument value Will display '--' for non-number values.
 * @argument limits Array [min, max]
 */
export default (containerId, title, initialValue = 0, limits = [0, 100], prefix = "", postfix = "") => {
    let currentVal = 0;

    const containerEl = document.getElementById(containerId);

    const titleEl = document.createElement("div");
    titleEl.classList.add("control-title");
    const titleText = document.createElement("span");
    const valueEl = document.createElement("div");
    valueEl.classList.add("control-value");
    const valueText = document.createElement("span");
    const limitsEl = document.createElement("div");
    limitsEl.classList.add("control-limits");
    const limitMin = document.createElement("span");
    limitMin.classList.add("control-limit-min");
    const limitMax = document.createElement("span");
    limitMax.classList.add("control-limit-max");
    const meterEl = document.createElement("div");
    meterEl.classList.add("control-meter");
    const meterBar = document.createElement("span");

    containerEl.appendChild(titleEl);
    titleEl.appendChild(titleText);
    containerEl.appendChild(valueEl);
    valueEl.appendChild(valueText);
    containerEl.appendChild(limitsEl);
    limitsEl.appendChild(limitMin);
    limitsEl.appendChild(limitMax);
    containerEl.appendChild(meterEl);
    meterEl.appendChild(meterBar);

    // Set values
    titleText.textContent = title;
    limitMin.textContent = limits[0];
    limitMax.textContent = limits[1];

    const clamp = (nr, min, max) => {
        return Math.min(Math.max(nr, min), max);
    };
    const setValue = (val) => {
        if (val === currentVal) {
            return;
        }        
        if (valueText) {
            valueText.textContent = `${prefix}${val}${postfix}`;
        }        
        if (meterBar) {
            const pct = ((val - limits[0]) / (limits[1] - limits[0])) * 100;
            meterBar.style.width = `${clamp(pct, 0, 100)}%`;
        }
        currentVal = val;
    };
    setValue(initialValue);

    return {
        setValue,
        destroy: () => {
            containerEl.innerHTML = "";
        }
    }
};