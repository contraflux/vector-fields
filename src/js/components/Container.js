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
    }

    resetFields() {
        this.coordScale = 25;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.mouseOffsetX = 0;
        this.mouseOffsetY = 0;
        this.initialLocations = [];
    }
}

export { FieldContainer };