(function() {
    // Ensure the neural-pointer element exists
    let pointer = document.getElementById('neural-pointer');
    if (!pointer) {
        pointer = document.createElement('div');
        pointer.id = 'neural-pointer';
        document.body.appendChild(pointer);
    }

    let hue = 0;

    function isDayTime() {
        const hour = new Date().getHours();
        return hour >= 6 && hour < 18;
    }

    function updatePointer() {
        const isDay = isDayTime();
        pointer.classList.toggle('day-mode', isDay);
        pointer.classList.toggle('night-mode', !isDay);

        hue = (hue + 2) % 360;
        // High lightness for daytime to prevent "dark" feel, standard for night
        const lightness = isDay ? 85 : 60; 
        pointer.style.setProperty('--rainbow-glow', `hsl(${hue}, 100%, ${lightness}%)`);
    }

    window.addEventListener('mousemove', (e) => {
        pointer.style.left = e.clientX + 'px';
        pointer.style.top = e.clientY + 'px';
    });

    function animate() {
        updatePointer();
        requestAnimationFrame(animate);
    }
    animate();
})();
