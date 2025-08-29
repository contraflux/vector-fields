import { fieldContainer } from '../core/app.js';

// Convert a pixel position to coordinates
function pixelsToCoords(w, h) {
    const x_0 = (w - fieldContainer.canvas.width/2) / fieldContainer.coordScale;
    const y_0 = -(h - fieldContainer.canvas.height/2) / fieldContainer.coordScale;

    return [x_0 - fieldContainer.offsetX, y_0 - fieldContainer.offsetY];
}

// Convert coordinates to a pixel position
function coordsToPixels(x, y) {
    const w_0 = (x + fieldContainer.offsetX) * fieldContainer.coordScale;
    const h_0 = -(y + fieldContainer.offsetY) * fieldContainer.coordScale

    return [w_0 + fieldContainer.canvas.width/2, h_0 + fieldContainer.canvas.height/2];
}

// Convert hex color codes to RGB
function hexToRGB(hex) {
    const chars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];

    let red = ( 16 * chars.indexOf(hex[1]) ) + chars.indexOf(hex[2]);
    let green = ( 16 * chars.indexOf(hex[3]) ) + chars.indexOf(hex[4]);
    let blue = ( 16 * chars.indexOf(hex[5]) ) + chars.indexOf(hex[6]);

    return [red, green, blue];
}

export { pixelsToCoords, coordsToPixels, hexToRGB };