import { canvas, coordScale, offsetX, offsetY } from '../core/app.js';

function pixelsToCoords(w, h) {
    const x_0 = (w - canvas.width/2) / coordScale;
    const y_0 = -(h - canvas.height/2) / coordScale;

    return [x_0 - offsetX, y_0 - offsetY];
}

function coordsToPixels(x, y) {
    const w_0 = (x + offsetX) * coordScale;
    const h_0 = -(y + offsetY) * coordScale

    return [w_0 + canvas.width/2, h_0 + canvas.height/2];
}

function log(a, b) {
    return Math.log(a) / Math.log(b);
}

function hexToRGB(hex) {
    const chars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];

    let red = ( 16 * chars.indexOf(hex[1]) ) + chars.indexOf(hex[2]);
    let green = ( 16 * chars.indexOf(hex[3]) ) + chars.indexOf(hex[4]);
    let blue = ( 16 * chars.indexOf(hex[5]) ) + chars.indexOf(hex[6]);

    return [red, green, blue];
}

function colorLerp(start_color, end_color, s) {
    const start_color_rgb = hexToRGB(start_color);
    const end_color_rgb = hexToRGB(end_color);

    const delta_red = end_color_rgb[0] - start_color_rgb[0];
    const red = (delta_red * s) + start_color_rgb[0];

    const delta_green = end_color_rgb[1] - start_color_rgb[1];
    const green = (delta_green * s) + start_color_rgb[1];

    const delta_blue = end_color_rgb[2] - start_color_rgb[2];
    const blue = (delta_blue * s) + start_color_rgb[2];

    return [red, green, blue];
}

export { pixelsToCoords, coordsToPixels, log, colorLerp };