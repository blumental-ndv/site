document.addEventListener('DOMContentLoaded', () => {
    // Номер телефона Ольги Блюменталь
    const code = '+7';
    const operator = '911'; 
    const digits = '2119347'; 
    const formatted = `${code} (${operator}) ${digits.slice(0,3)}-${digits.slice(3,5)}-${digits.slice(5,7)}`;
    const raw = code + operator + digits;

    const container = document.getElementById('phone-container');
    
    if (container) {
        container.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            // Чистый HTML-шаблон для вывода (иконка + жирный номер)
            const innerContent = `<span class="icon">📞</span><strong class="phone-number-text">${formatted}</strong>`;
            
            if (isMobile) {
                // На смартфонах создаем прямую ссылку для звонка
                const link = document.createElement('a');
                link.href = `tel:${raw}`;
                // Применяем флекс-выравнивание прямо к ссылке, чтобы трубка стояла ровно по центру с номером
                link.style.display = 'inline-flex';
                link.style.alignItems = 'center';
                link.style.textDecoration = 'none';
                link.style.color = 'inherit';
                link.innerHTML = innerContent;
                
                // Полностью очищаем div и вставляем ссылку с трубкой внутрь
                container.innerHTML = '';
                container.appendChild(link);
                
                // Запускаем системный вызов на телефоне
                window.location.href = `tel:${raw}`;
            } else {
                // На ПК просто выводим иконку и номер напрямую в div
                container.innerHTML = innerContent;
            }
        });
    }
});
