/**
 * plotting
 * 
 * Functions for drawing grid, scalar fields, vector fields, and paths on
 * the canvas
 * 
 * @author contraflux
 * @date 10/2/2025
 */

import { pixelsToCoords, log, coordsToPixels, light, hexToRGB, lerpRGB } from './utilities.js';
import { rk4Path, map } from "./math.js"

/**
 * Draws a scaled orthonormal coordinate grid with major and minor gridlines,
 * as well as coordinate labels
 *
 * @param {FieldContainer} fieldContainer - The app container
 */
export function drawGrid(fieldContainer) {
    const ctx = fieldContainer.ctx;23
    const gridSpacing = Math.pow(5, Math.ceil(log(50 / fieldContainer.coordScale, 5)));

    // Canvas bounds
    const upperLeftBound = pixelsToCoords(0, 0);
    const lowerRightBound = pixelsToCoords(canvas.width, canvas.height);

    // Loop twice, once for the x and y directions (0 => x, 1 => y)
    for (let i = 0; i <= 1; i++) {
        let min;
        let max;

        // Find minimum and maximum coordinate values
        if (i == 0) {
            min = Math.floor(upperLeftBound[i] / gridSpacing) * gridSpacing; // Minimum x
            max = lowerRightBound[i]; // Maximum x
        } else {
            min = Math.floor(lowerRightBound[i] / gridSpacing) * gridSpacing; // Minimum y
            max = upperLeftBound[i]; // Maximum y
        }

        // Loop over grid positions
        for (let n = min; n <= max; n += gridSpacing) {
            const w = coordsToPixels(n, 0)[0]; // Width position on canvas
            const h = coordsToPixels(0, n)[1]; // Height position on canvas

            ctx.strokeStyle = light; // Stroke color
            ctx.fillStyle = light; // Fill color
            ctx.lineWidth = n == 0 ? 1 : 0.2; // Stroke widths for major and minor gridlines
            ctx.font = "18px serif"; // Font size

            ctx.save();
            ctx.beginPath();
            if (i == 0) {
                ctx.moveTo(w, 0); // Start at the top at the correct width
                ctx.lineTo(w, canvas.height - 20); // Draw down to the bottom
                ctx.fillText(n.toFixed(1), w, canvas.height - 5); // Width grid numbers
            } else {
                ctx.moveTo(0, h); // Start on the side at the correct height
                ctx.lineTo(canvas.width - 40, h); // Draw across to the other side
                ctx.fillText(n.toFixed(1), canvas.width - 30, h); // Height grid numbers
            }
            ctx.stroke();
            ctx.restore();
        }
    }
}

/**
 * Draws a heatmap reperesenting a scalar field
 *
 * @param {FieldContainer} fieldContainer - The app container
 * @param {array} xs - The x coordinates of the grid
 * @param {array} ys - The y coordinates of the grid
 * @param {function} func - The function to be operated on
 * @param {function} operator - The operator to evaluate on the function
 * @param {stirng} start_color - Color of the minimum value in hex
 * @param {string} end_color - Color of the maximum value in hex
 * @returns {float} The symmetric bound of the field, i.e. the value mapped to
 *                  the start/end colors (see map() in math.js)
 */
export function drawScalarField(fieldContainer, xs, ys, func, operator, start_color, end_color) {
    const ctx = fieldContainer.ctx;

    const dx = xs[1] - xs[0];
    const dy = ys[1] - ys[0];
    const width = xs.length;
    const height = ys.length;
    let scalarField = [];

    // Precompute the color range endpoints once instead of per grid point
    const start_rgb = hexToRGB(start_color);
    const end_rgb = hexToRGB(end_color);

    // Collect the values of the field at the grid points
    for (const x of xs) {
        for (const y of ys) {
            scalarField.push(operator(func, x + dx/2, y + dy/2)); // Evaluate at the midpoint of two grid points
        }
    }
    const max = Math.max(...scalarField);
    const min = Math.min(...scalarField);

    // Rasterize one pixel per grid cell onto a small offscreen canvas, then
    // scale it up with smoothing enabled so the field reads as a continuous
    // gradient rather than hard-edged blocks
    const scalarCanvas = fieldContainer.scalarCanvas;
    scalarCanvas.width = width;
    scalarCanvas.height = height;

    const scalarCtx = scalarCanvas.getContext('2d');
    const imageData = scalarCtx.createImageData(width, height);

    xs.forEach((x, x_index) => {
        ys.forEach((y, y_index) => {
            const value = scalarField[(x_index * height) + y_index];
            const [r, g, b] = lerpRGB(start_rgb, end_rgb, map(min, max, value));

            const row = height - 1 - y_index; // Flip so larger y ends up nearer the top
            const pixelIndex = ((row * width) + x_index) * 4;
            imageData.data[pixelIndex] = r;
            imageData.data[pixelIndex + 1] = g;
            imageData.data[pixelIndex + 2] = b;
            imageData.data[pixelIndex + 3] = 255;
        });
    });

    scalarCtx.putImageData(imageData, 0, 0);

    // The grid cell values were evaluated at cell midpoints, so the drawn
    // region spans from the first grid point to one cell past the last
    const [destX, destY] = coordsToPixels(xs[0], ys[height - 1] + dy);
    const [destX2, destY2] = coordsToPixels(xs[width - 1] + dx, ys[0]);

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(scalarCanvas, destX, destY, destX2 - destX, destY2 - destY);

    // map() scales symmetrically about 0, saturating fully at
    // +-max(|min|, |max|) rather than at the raw min/max
    return Math.max(Math.abs(min), Math.abs(max));
}

/**
 * Draws a vertical colorbar showing the color scale used by drawScalarField
 *
 * @param {FieldContainer} fieldContainer - The app container
 * @param {string} start_color - Color of the minimum value in hex
 * @param {string} end_color - Color of the maximum value in hex
 * @param {float} bound - The symmetric bound returned by drawScalarField
 */
export function drawColorbar(fieldContainer, start_color, end_color, bound) {
    const ctx = fieldContainer.ctx;
    const canvas = fieldContainer.canvas;

    const barWidth = 16;
    const margin = 10; // Gap between the panel and the canvas edge
    const radius = 15; // Panel corner radius
    const pad = 15; // Inner padding around the bar and labels

    const format = (value) => value === 0 ? "0" : value.toPrecision(3);
    const topLabel = format(bound);
    const midLabel = "0";
    const bottomLabel = format(-bound);

    ctx.save();

    // Size the panel to fit the (already-rounded) labels, rather than a
    // fixed width, since the y-axis labels already occupy the right side
    ctx.font = "12px serif";
    const labelWidth = Math.max(
        ctx.measureText(topLabel).width,
        ctx.measureText(midLabel).width,
        ctx.measureText(bottomLabel).width
    );

    const panelX = margin;
    const panelY = margin;
    const panelWidth = pad + barWidth + pad/2 + labelWidth + pad;
    const panelHeight = canvas.height - (2 * margin);

    const barX = panelX + pad;
    const barY = panelY + pad;
    const barHeight = panelHeight - (2 * pad);

    // Backing panel so the colorbar stays legible over the field/grid
    ctx.fillStyle = "rgba(23, 24, 30, 0.85)";
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, radius);
    ctx.fill();

    if (bound === 0) {
        // The field is uniformly 0: show a solid swatch of the halfway
        // color instead of a gradient that implies variation that isn't there
        const [r, g, b] = lerpRGB(hexToRGB(start_color), hexToRGB(end_color), 0.5);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    } else {
        const gradient = ctx.createLinearGradient(0, barY, 0, barY + barHeight);
        gradient.addColorStop(0, end_color);
        gradient.addColorStop(1, start_color);
        ctx.fillStyle = gradient;
    }
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.strokeStyle = light;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = light;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const labelX = barX + barWidth + pad/2;
    ctx.fillText(topLabel, labelX, barY);
    ctx.fillText(midLabel, labelX, barY + (barHeight / 2));
    ctx.fillText(bottomLabel, labelX, barY + barHeight);

    ctx.restore();
}

/**
 * Draws a vector field from an array of vectors
 *
 * @param {FieldContainer} fieldContainer - The app container
 * @param {array} xs - The x coordinates of the grid
 * @param {array} ys - The y coordinates of the grid
 * @param {function} func - The vector field
 * @param {stirng} start_color - Color of the minimum value in hex
 * @param {string} end_color - Color of the maximum value in hex
 * @param {float} vectorScale - The scale factor of the vector tail
 * @param {float} arrowScale - The scale factor of the vector head
 * @param {boolean} isNoramlized - Whether to normalize the vectors
 * @param {boolean} drawArrows - Whether to draw the vector heads
 */
export function drawVectorField(fieldContainer, xs, ys, func, start_color, end_color, vectorScale, arrowScale, isNormalized, drawArrows) {
    const ctx = fieldContainer.ctx;

    let vectorField = [];
    let colors = [];

    // Precompute the color range endpoints once instead of per grid point
    const start_rgb = hexToRGB(start_color);
    const end_rgb = hexToRGB(end_color);

    // Find the values of the vector field at every grid point
    for (const x of xs) {
        for (const y of ys) {
            const v = func(x, y);
            if (isNaN(v[0]) || isNaN(v[1])) {
                vectorField.push([0, 0]);
            } else {
                vectorField.push(v);
            }
        }
    }

    // Assign each vector to a color in the color range based on its length
    const lengths = vectorField.map((v) => Math.hypot(...v));
    const max_length = Math.max(...lengths);
    for (const l of lengths) {
        const rgb = lerpRGB(start_rgb, end_rgb, l/max_length);
        colors.push(`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`);
    }

    // Loop through the grid positions and draw the vector
    xs.forEach((x, x_index) => {
        ys.forEach((y, y_index) => {
            const index = (x_index * ys.length) + y_index;

            // Vector coordinates
            let x_dot = vectorField[index][0];
            let y_dot = vectorField[index][1];
            const length = lengths[index];

            // Location of the vector tail
            const [tail_width, tail_height] = coordsToPixels(x, y);

            // Normalize the vector based on the argument
            if (isNormalized) {
                x_dot /= length;
                y_dot /= length;
            }

            // Location of the vector head
            const head_width = tail_width + (x_dot * fieldContainer.coordScale * vectorScale);
            const head_height = tail_height - (y_dot * fieldContainer.coordScale * vectorScale);

            ctx.strokeStyle = colors[index];
            ctx.fillStyle = colors[index];
            ctx.lineWidth = 1;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(tail_width, tail_height);
            ctx.lineTo(head_width, head_height);
            ctx.stroke();
            ctx.restore();

            if (drawArrows) {
                ctx.save();
                ctx.translate(head_width, head_height);
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

/**
 * Draws a path by estimating solutions to a differentual equation described
 * by a function using the Runge-Kutta method
 *
 * @param {FieldContainer} fieldContainer - The app container
 * @param {function} F - The differential equation
 * @param {int} iterations - The number of iterations to perform
 * @param {float} dt - The time step between iterations
 */
export function drawPaths(fieldContainer, F, iterations, dt) {
    const ctx = fieldContainer.ctx;

    // Draw the path for every initial condition in fieldContainer
    for (const initial of fieldContainer.initialLocations) {
        // Estimate the solution using the Runge-Kutta algorithm
        const [xs, ys] = rk4Path(F, dt, initial[0], initial[1], iterations)

        ctx.strokeStyle = light;
        ctx.lineWidth = 2;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(...coordsToPixels(xs[0], ys[0]));
        // Draw a line to each estimated position in the solution
        for (let i = 0; i < xs.length; i++) {
            ctx.lineTo(...coordsToPixels(xs[i], ys[i]));
        }
        ctx.stroke();
        ctx.restore();
    }
}