document.addEventListener('DOMContentLoaded', () => {
    // Работает только там, где заголовки реально прилипают (мобильные экраны,
    // см. @media (max-width: 600px) в style.css) — но сам наблюдатель лёгкий
    // и не мешает на десктопе, просто там класс title-stuck никак не используется.
    const sentinels = document.querySelectorAll('.sticky-sentinel');
    if (sentinels.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const title = entry.target.nextElementSibling;
            if (!title) return;
            // Датчик скрылся за верхом экрана — значит, заголовок прилип
            title.classList.toggle('title-stuck', !entry.isIntersecting && entry.boundingClientRect.top < 0);
        });
    }, {
        threshold: 0,
        rootMargin: '0px'
    });

    sentinels.forEach((sentinel) => observer.observe(sentinel));
});
