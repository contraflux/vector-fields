/**
 * Container
 * 
 * Classes for organizing content needed across scripts
 * 
 * @author contraflux
 * @date 10/2/2025
 */

class Container {
    constructor(id) {
        this.canvas = document.getElementById(id);
        this.ctx = this.canvas.getContext('2d');
    }
}

class FieldContainer extends Container {
    constructor(id) {
        super(id);
        this.coordScale = 25;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.mouseOffsetX = 0;
        this.mouseOffsetY = 0;
        this.initialLocations = [];
        this.zoomSpeed = 2e-3;
        this.overlay = "none";
    }

    resetFields() {
        this.coordScale = 25;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.mouseOffsetX = 0;
        this.mouseOffsetY = 0;
        this.initialLocations = [];
        this.overlay = "none";
    }

    dragGrid(e) {
        if (!this.isDragging) return null;

        this.offsetX += e.movementX / this.coordScale;
        this.offsetY -= e.movementY / this.coordScale;
    }

    zoomGrid(e) {
        this.coordScale += e.deltaY * this.coordScale * this.zoomSpeed;

        if (this.coordScale < 1e-5) {
            this.coordScale = 1e-5;
        }
    }
}

export { FieldContainer };