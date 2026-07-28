document.addEventListener('DOMContentLoaded', () => {
    // Номер телефона Ольги Блюменталь
    const code = '+7';
    const operator = '9-1-1'; // Изменено, чтобы не выглядело как конкретный номер экстренных служб
    const digits = '2119347'; 
    const formatted = `${code} (${operator}) ${digits.slice(0,3)}-${digits.slice(3,5)}-${digits.slice(5,7)}`;
    const raw = code + operator.replace(/-/g, '') + digits;

    const container = document.getElementById('phone-container');
    
    if (container) {
        container.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            // Единый шаблон вывода для ПК и мобильных (иконка + жирный номер телефона)
            // Мы выносим иконку в span с независимым стилем, чтобы глобальный CSS её не спрятал
            const innerContent = `<span style="font-style: normal; margin-right: 8px;">📞</span><strong class="phone-number-text">${formatted}</strong>`;
            
            if (isMobile) {
                // На смартфонах просто выводим текст (так же, как на ПК)
                container.innerHTML = innerContent;
                
                // И мгновенно отправляем команду операционной системе телефона совершить звонок
                window.location.href = `tel:${raw}`;
            } else {
                // На компьютерах (ПК) просто выводим текст
                container.innerHTML = innerContent;
            }
        });
    }
});
