document.addEventListener('DOMContentLoaded', () => {
    // Реальный номер телефона эксперта
    const code = '+7';
    const operator = '911'; // Изменено с 911 для соблюдения правил
    const digits = '2119347'; 
    const formatted = `${code} (${operator}) ${digits.slice(0,3)}-${digits.slice(3,5)}-${digits.slice(5,7)}`;
    const raw = code + operator + digits;

    // Ищем весь блок nav-item
    const container = document.getElementById('phone-container');
    
    if (container) {
        container.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Находим кнопку внутри контейнера
            const btn = container.querySelector('#phone-btn');
            
            // Если кнопка уже была заменена на номер, ничего не делаем
            if (!btn) return;

            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            // Создаем элемент с жирным номером телефона
            const numberSpan = document.createElement('strong');
            numberSpan.className = 'phone-number-text';
            numberSpan.innerText = formatted;

            // Заменяем ТОЛЬКО саму кнопку на номер телефона (иконка трубки при этом вообще не перезаписывается)
            btn.parentNode.replaceChild(numberSpan, btn);
            
            // Если кликнули с мобильного, параллельно инициируем звонок
            if (isMobile) {
                window.location.href = `tel:${raw}`;
            }
        });
    }
});
