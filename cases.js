document.addEventListener('DOMContentLoaded', () => {
    const sliders = document.querySelectorAll('[data-slider]');

    sliders.forEach((slider) => {
        const track = slider.querySelector('.case-plan-track');
        const slides = Array.from(slider.querySelectorAll('.case-plan-slide'));
        const prevBtn = slider.querySelector('.slider-arrow-prev');
        const nextBtn = slider.querySelector('.slider-arrow-next');
        const dotsWrap = slider.querySelector('.slider-dots');

        if (!track || slides.length === 0) return;

        // Если фото/слайд всего один — стрелки и точки не нужны
        if (slides.length <= 1) {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            if (dotsWrap) dotsWrap.style.display = 'none';
            return;
        }

        let index = 0;

        // Создаём точки-индикаторы под слайдером
        const dots = slides.map((_, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'slider-dot';
            dot.setAttribute('aria-label', `Слайд ${i + 1}`);
            dot.addEventListener('click', () => goTo(i));
            dotsWrap.appendChild(dot);
            return dot;
        });

        function update() {
            track.style.transform = `translateX(-${index * 100}%)`;
            dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
        }

        function goTo(i) {
            index = (i + slides.length) % slides.length;
            update();
        }

        prevBtn.addEventListener('click', () => goTo(index - 1));
        nextBtn.addEventListener('click', () => goTo(index + 1));

        // Свайп на тачскринах
        let touchStartX = 0;
        track.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        track.addEventListener('touchend', (e) => {
            const diff = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(diff) > 40) {
                diff > 0 ? goTo(index - 1) : goTo(index + 1);
            }
        }, { passive: true });

        update();
    });
});
