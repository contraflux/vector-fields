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
import { drawGrid, drawScalarField, drawColorbar, drawVectorField, drawPaths } from "./util/plotting.js";
import { log, pixelsToCoords, light } from "./util/utilities.js";
import { compileExpression } from "./util/expression.js";

export const fieldContainer = new FieldContainer('canvas');
const canvas = fieldContainer.canvas;
const ctx = fieldContainer.ctx;

// Diverging color scale for the divergence/curl overlays: blue for negative
// values, red for positive, so it reads distinctly from the default
// black/white vector field colors
const OVERLAY_START_COLOR = "#3b82f6";
const OVERLAY_END_COLOR = "#ef4444";

let cachedXDot = null;
let cachedYDot = null;
let compiledXDot = () => 0;
let compiledYDot = () => 0;

/**
 * Recompile the dx/dt and dy/dt expressions when their text changes, marking
 * whichever input is invalid rather than throwing
 *
 * @param {string} xDot - The dx/dt expression text
 * @param {string} yDot - The dy/dt expression text
 */
function updateCompiledFields(xDot, yDot) {
    const xDotInput = document.getElementById('x-dot');
    const yDotInput = document.getElementById('y-dot');

    if (xDot !== cachedXDot) {
        cachedXDot = xDot;
        try {
            compiledXDot = compileExpression(xDot);
            xDotInput.classList.remove('input-error');
        } catch (err) {
            xDotInput.classList.add('input-error');
        }
    }

    if (yDot !== cachedYDot) {
        cachedYDot = yDot;
        try {
            compiledYDot = compileExpression(yDot);
            yDotInput.classList.remove('input-error');
        } catch (err) {
            yDotInput.classList.add('input-error');
        }
    }
}

/**
 * Periodic function that runs every tick and contains most drawing and calculation
 */
function appPeriodic() {
    const [xDot, yDot, isNormalized, arrowScale, startColor, endColor, arrowDensity] = getInputs();
    const [step, xs, ys, scalar_xs, scalar_ys] = getGrid(arrowDensity);

    updateCompiledFields(xDot, yDot);

    function F(x, y) {
        return [compiledXDot(x, y), compiledYDot(x, y)];
    }

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = light;
    ctx.strokeStyle = light;
    ctx.font = "12px serif";

    // Draw the scalar field if it is selected
    let overlayBound = null;
    if (fieldContainer.overlay == "div") {
        overlayBound = drawScalarField(fieldContainer, scalar_xs, scalar_ys, F, divergence,
                        OVERLAY_START_COLOR, OVERLAY_END_COLOR); // Draw divergence
    } else if (fieldContainer.overlay == "curl") {
        overlayBound = drawScalarField(fieldContainer, scalar_xs, scalar_ys, F, curl,
                        OVERLAY_START_COLOR, OVERLAY_END_COLOR); // Draw curl
    }
    drawGrid(fieldContainer); // Draw the coordinate grid
    drawVectorField(fieldContainer, xs, ys, F, startColor,
                    endColor, arrowScale * step,
                    0.15 * step, isNormalized, true); // Draw the vector field
    drawPaths(fieldContainer, F, 1e3, 1e-2); // Draw the paths

    if (overlayBound !== null) {
        drawColorbar(fieldContainer, OVERLAY_START_COLOR, OVERLAY_END_COLOR, overlayBound); // Draw the colorbar
    }
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

    // Scalar field boxes are sized as a fraction of gridSpacing (rather than
    // of the visible range) and anchored to min_x/min_y, which are already
    // snapped to a multiple of gridSpacing. This keeps the box lattice fixed
    // in world space while panning, only rescaling when gridSpacing changes.
    const scalarStep = gridSpacing / 5;
    const scalar_xs = range(min_x - scalarStep, max_x + scalarStep, scalarStep);
    const scalar_ys = range(min_y - scalarStep, max_y + scalarStep, scalarStep);

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