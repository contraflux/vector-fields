/**
 * app
 * 
 * Main script for the app, contains evaluation of user input, calling of draw
 * functions for the scalar fields, vector fields, and paths, periodic function
 * and event listeners
 * 
 * @author contraflux
 * @date 10/2/2025
 */

import { FieldContainer} from "./components/Container.js"
import { divergence, curl } from "./util/math.js"
import { range } from "./util/arrays.js";
import { drawGrid, drawScalarField, drawVectorField, drawPaths } from "./util/plotting.js";
import { log, pixelsToCoords, light } from "./util/utilities.js";

export const fieldContainer = new FieldContainer('canvas');
const canvas = fieldContainer.canvas;
const ctx = fieldContainer.ctx;

/**
 * Periodic function that runs every tick and contains most drawing and calculation
 */
function appPeriodic() {
    const [xDot, yDot, isNormalized, arrowScale, startColor, endColor, arrowDensity] = getInputs();
    const [step, xs, ys, scalar_xs, scalar_ys] = getGrid(arrowDensity);

    function F(x, y) {
        const pi = Math.PI;
        const e = Math.E;
        function sin(x) { return Math.sin(x); }
        function cos(x) { return Math.cos(x); }
        function tan(x) { return Math.tan(x); }
        function pow(x, y) { return Math.pow(x, y); }
        function sqrt(x) { return Math.sqrt(x); }
        function log(x) { return Math.log(x); }
        function ceil(x) { return Math.ceil(x); }
        function floor(x) { return Math.floor(x); }

        return [eval(xDot), eval(yDot)];
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = light;
    ctx.strokeStyle = light;
    ctx.font = "12px serif";

    // Draw the scalar field if it is selected
    if (fieldContainer.overlay == "div") {
        drawScalarField(fieldContainer, scalar_xs, scalar_ys, F, divergence,
                        "#000000", "#ffffff"); // Draw divergence
    } else if (fieldContainer.overlay == "curl") {
        drawScalarField(fieldContainer, scalar_xs, scalar_ys, F, curl,
                        "#000000", "#ffffff"); // Draw curl
    }
    drawGrid(fieldContainer); // Draw the coordinate grid
    drawVectorField(fieldContainer, xs, ys, F, startColor,
                    endColor, arrowScale * step,
                    0.15 * step, isNormalized, true); // Draw the vector field
    drawPaths(fieldContainer, F, 1e3, 1e-2); // Draw the paths
}

/**
 * Determine the grid coordinates for vector and scalar fields
 *
 * @returns {array} Grid information including step size, the grid for vector
 *                  fields, and the grid for scalar fields
 */
function getInputs() {
    const xDot = document.getElementById('x-dot').value;
    const yDot = document.getElementById('y-dot').value;
    const isNormalized = document.getElementById('normalize-tick').checked;
    const arrowScale = document.getElementById('arrow-scale').value;
    const startColor = document.getElementById('start-color').value;
    const endColor = document.getElementById('end-color').value;
    const arrowDensity = document.getElementById('arrow-density').value;
    const overlay = document.getElementById('overlay').value;

    fieldContainer.overlay = overlay;

    return [xDot, yDot, isNormalized, arrowScale, startColor, endColor, arrowDensity];
}

/**
 * Determine the grid coordinates for vector and scalar fields
 *
 * @returns {array} Grid information including step size, the grid for vector
 *                  fields, and the grid for scalar fields
 */
function getGrid(arrowDensity) {
    const upperLeftBound = pixelsToCoords(0, 0);
    const lowerRightBound = pixelsToCoords(canvas.width, canvas.height);

    const gridSpacing = Math.pow(5, Math.ceil(log(50 / fieldContainer.coordScale, 5)));

    const min_x = Math.floor(upperLeftBound[0] / gridSpacing) * gridSpacing;
    const max_x = lowerRightBound[0];
    const min_y = Math.floor(lowerRightBound[1] / gridSpacing) * gridSpacing;
    const max_y = upperLeftBound[1];

    const step = gridSpacing / arrowDensity;
    const xs = range(min_x - step, max_x + step, step);
    const ys = range(min_y - step, max_y + step, step);
    const scalar_xs = range(min_x - step, max_x + step, step/2);
    const scalar_ys = range(min_y - step, max_y + step, step/2);

    return [step, xs, ys, scalar_xs, scalar_ys];
}

/**
 * Adds a path when the canvas is clicked
 *
 * @param {event} e - The mouse click event
 */
function addPath(e) {
    const rect = canvas.getBoundingClientRect();
    const coords = pixelsToCoords(e.clientX - rect.left, e.clientY - rect.top);

    fieldContainer.initialLocations.push(coords);
}

canvas.addEventListener('mousedown', (e) => { fieldContainer.isDragging = true; });
canvas.addEventListener('mousemove', (e) => fieldContainer.dragGrid(e));
canvas.addEventListener('mouseup', () => { fieldContainer.isDragging = false; })
canvas.addEventListener('wheel', (e) => fieldContainer.zoomGrid(e));
canvas.addEventListener('dblclick', (e) => addPath(e));

document.addEventListener('keypress', (e) => {
    if (e.key == 'r') fieldContainer.resetFields();
});

setInterval(appPeriodic, 10);