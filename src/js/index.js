const scroll_menu = document.getElementById('scroll');
const scroll_bar = document.getElementById('scroll-bar');

let offset = 0;

scroll_menu.addEventListener('wheel', (e) => {
    offset += e.deltaY / 2;

    console.log(offset);

    offset = offset < 0 ? 0 : offset > 50 ? 50 : offset;

    scroll_menu.style.top = -offset + "px";
    scroll_bar.style.top = offset + "px";
});