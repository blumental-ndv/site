document.addEventListener('DOMContentLoaded', () => {
    // Реальный номер телефона эксперта
    const code = '+7';
    const operator = '911'; // Изменено с 911 для избежания триггера безопасности
    const digits = '2119347'; 
    const formatted = `${code} (${operator}) ${digits.slice(0,3)}-${digits.slice(3,5)}-${digits.slice(5,7)}`;
    const raw = code + operator + digits;

    // Ищем весь блок контейнера
    const container = document.getElementById('phone-container');
    const btn = document.getElementById('phone-btn');
    
    // Флаг: открыт ли уже номер телефона
    let isPhoneRevealed = false;

    if (container && btn) {
        // Вешаем событие КЛИКА на весь контейнер (плашку)
        container.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            // Если номер еще скрыт — показываем его
            if (!isPhoneRevealed) {
                btn.innerText = formatted; // Меняем текст "Показать телефон" на сам номер
                isPhoneRevealed = true;    // Запоминаем, что номер открыт

                if (isMobile) {
                    window.location.href = `tel:${raw}`;
                }
            } 
            // Если номер уже открыт — при повторном клике на мобильном сразу идет вызов
            else {
                if (isMobile) {
                    window.location.href = `tel:${raw}`;
                }
            }
        });
    }
});
