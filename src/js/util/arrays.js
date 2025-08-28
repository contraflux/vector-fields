function linRange(start, end, count) {
    const spacing = (end - start) / (count - 1);
    let arr = [];

    for (let i = start; i <= end; i += spacing) {
        arr.push(i);
    }

    return arr;
}

function range(start, end, step) {
    let arr = [];

    for (let i = start; i < end; i += step) {
        arr.push(i);
    }

    return arr;
}

export { linRange, range };