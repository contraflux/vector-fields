import { FieldContainer} from "../components/Container.js"

import { pixelsToCoords, coordsToPixels, hexToRGB } from "../util/conversions.js";
import { log, colorLerp } from "../util/utilities.js";
import { linRange, range } from "../util/arrays.js";
import { rainbow, highlight, light, dark } from "../util/colors.js";

export const fieldContainer = new FieldContainer('canvas');
export const dt = 1e-2;

const canvas = fieldContainer.canvas;
const ctx = fieldContainer.ctx;

const xdot_input = document.getElementById('x-dot');
const ydot_input = document.getElementById('y-dot');
const start_color_input = document.getElementById('start-color');
const end_color_input = document.getElementById('end-color');
const normalized_input = document.getElementById('normalize-tick');
const arrow_scale_input = document.getElementById('arrow-scale');
const arrow_density_input = document.getElementById('arrow-density');

function drawGrid() {
    const upperLeftBound = pixelsToCoords(0, 0);
    const lowerRightBound = pixelsToCoords(canvas.width, canvas.height);

    const gridSpacing = Math.pow(5, Math.ceil(log(50 / fieldContainer.coordScale, 5)));

    const min_x = Math.floor(upperLeftBound[0] / gridSpacing) * gridSpacing;
    const max_x = lowerRightBound[0];


    for (let x = min_x; x <= max_x; x += gridSpacing) {
        const w = coordsToPixels(x, 0)[0];

        ctx.strokeStyle = light;
        ctx.lineWidth = x == 0 ? 1 : 0.2;
        ctx.font = "18px serif";
        ctx.save();
        ctx.translate(w, 0);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, canvas.height - 20);
        ctx.stroke();
        ctx.fillText(x.toFixed(1), 0, canvas.height - 5);
        ctx.restore();
    }

    const min_y = Math.floor(lowerRightBound[1] / gridSpacing) * gridSpacing;
    const max_y = upperLeftBound[1];

    for (let y = min_y; y <= max_y; y += gridSpacing) {
        const h = coordsToPixels(0, y)[1];

        ctx.strokeStyle = light;
        ctx.lineWidth = y == 0 ? 1 : 0.2;
        ctx.font = "18px serif";
        ctx.save();
        ctx.translate(0, h);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(canvas.width - 40, 0);
        ctx.stroke();
        ctx.fillText(y.toFixed(1), canvas.width - 30, 0);
        ctx.restore();
    }
}

function drawVectorField(xs, ys, vecs, colors, vectorScale, arrowScale, isNormalized, drawArrows) {
    xs.forEach((x, x_index) => {
        ys.forEach((y, y_index) => {
            const pixels = coordsToPixels(x, y);

            const index = (x_index * ys.length) + y_index;
            let x_dot = vecs[index][0];
            let y_dot = vecs[index][1];
            const magnitude = Math.hypot(x_dot, y_dot);

            if (isNormalized) {
                x_dot /= magnitude;
                y_dot /= magnitude;
            }

            const x_pixel = x_dot * fieldContainer.coordScale * vectorScale;
            const y_pixel = -y_dot * fieldContainer.coordScale * vectorScale;

            ctx.strokeStyle = colors[index];
            ctx.fillStyle = colors[index];
            ctx.lineWidth = 1;
            ctx.save();
            ctx.translate(pixels[0], pixels[1]);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(x_pixel, y_pixel);
            ctx.stroke();
            ctx.restore();

            if (drawArrows) {
                ctx.save();
                ctx.translate(pixels[0], pixels[1]);
                ctx.translate(x_pixel, y_pixel);
                ctx.rotate(Math.atan2(x_dot, y_dot));
                ctx.beginPath();
                ctx.moveTo(arrowScale * fieldContainer.coordScale / 2, arrowScale * fieldContainer.coordScale / 2);
                ctx.lineTo(0, 0)
                ctx.lineTo(-arrowScale * fieldContainer.coordScale / 2, arrowScale * fieldContainer.coordScale / 2);
                ctx.fill();
                ctx.restore();
            }
        });
    });
}

function appPeriodic() {
    const upperLeftBound = pixelsToCoords(0, 0);
    const lowerRightBound = pixelsToCoords(canvas.width, canvas.height);

    const gridSpacing = Math.pow(5, Math.ceil(log(50 / fieldContainer.coordScale, 5)));

    const min_x = Math.floor(upperLeftBound[0] / gridSpacing) * gridSpacing;
    const max_x = lowerRightBound[0];
    const min_y = Math.floor(lowerRightBound[1] / gridSpacing) * gridSpacing;
    const max_y = upperLeftBound[1];

    const arrowDensity = arrow_density_input.value;

    const step = gridSpacing / arrowDensity;
    const xs = range(min_x - step, max_x + step, step);
    const ys = range(min_y - step, max_y + step, step);

    const xdot = xdot_input.value;
    const ydot = ydot_input.value;

    const isNormalized = normalized_input.checked;
    const arrowScale = arrow_scale_input.value / 1000;
    

    function F(x, y) {
        // Simplifying syntax
        function sin(x) { return Math.sin(x); }
        function cos(x) { return Math.cos(x); }
        function tan(x) { return Math.tan(x); }
        function pow(x, y) { return Math.pow(x, y); }
        function sqrt(x) { return Math.sqrt(x); }
        function log(x) { return Math.log(x); }

        return [eval(xdot), eval(ydot)];
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = light;
    ctx.strokeStyle = light;
    ctx.font = "12px serif";

    const vecs = []
    for (const x of xs) {
        for (const y of ys) {
            const value = F(x, y);
            if (isNaN(value[0]) || isNaN(value[1])) {
                vecs.push([0, 0]);
            } else {
                vecs.push(value);
            }
        }
    }

    const start_color = start_color_input.value;
    const end_color = end_color_input.value;    

    const lengths = vecs.map((v) => Math.hypot(...v));
    const max_length = Math.max(...lengths);
    const colors = lengths.map((l) => `rgba(${colorLerp(start_color, end_color, l/max_length)[0]}, ${colorLerp(start_color, end_color, l/max_length)[1]}, ${colorLerp(start_color, end_color, l/max_length)[2]}, 1)`);

    drawGrid();
    drawVectorField(xs, ys, vecs, colors, arrowScale * step, step * 0.15, isNormalized, true);
    drawPaths(F, 1e3);
}

function addPath(e) {
    const rect = canvas.getBoundingClientRect();
    const coords = pixelsToCoords(e.clientX - rect.left, e.clientY - rect.top);

    fieldContainer.initialLocations.push(coords);
}

function drawPaths(F, iters) {
    for (const initial of fieldContainer.initialLocations) {
        let x = initial[0];
        let y = initial[1];

        ctx.fillStyle = light;
        ctx.strokeStyle = light;
        ctx.lineWidth = 2;
        ctx.font = "12px serif";
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(...coordsToPixels(x, y));
        for (let t = 0; t < iters; t++) {
            let dx = F(x, y)[0] * dt;
            let dy = F(x, y)[1] * dt;

            x += dx;
            y += dy;

            ctx.lineTo(...coordsToPixels(x, y));
        }
        ctx.stroke();
        ctx.restore(0)
    }
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