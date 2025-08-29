import { pixelsToCoords, coordsToPixels, hexToRGB } from "../util/conversions.js";

// Log change of base wrapper
function log(a, b) {
    return Math.log(a) / Math.log(b);
}

// Linearly interpolate between two hex codes using s as the parameter
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

export { log, colorLerp };