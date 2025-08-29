import { dt } from "../core/app.js";

function partial_x(F, x, y) {
    return ( F(x + dt, y)[0] - F(x, y)[0] ) / dt;
}

function partial_y(F, x, y) {
    return ( F(x, y + dt)[1] - F(x, y)[1] ) / dt;
}

function divergence(F, x, y) {
    return partial_x(F, x, y) + partial_y(F, x, y);
}

function curl(F, x, y) {
    const Fy_dx = ( F(x + dt, y)[1] - F(x, y)[1] ) / dt
    const Fx_dy = ( F(x, y + dt)[0] - F(x, y)[0] ) / dt
    return Fy_dx - Fx_dy;
}

export { partial_x, partial_y, divergence, curl };