document.addEventListener('DOMContentLoaded', () => {
    const card = document.getElementById('quiz-card');
    if (!card) return;

    const steps = Array.from(card.querySelectorAll('.quiz-step'));
    const dots = Array.from(card.querySelectorAll('.quiz-dot'));
    const answers = { rooms: '', budget: '' };
    let channel = 'telegram';

    function goToStep(n) {
        steps.forEach((step) => {
            step.classList.toggle('active', Number(step.dataset.step) === n);
        });
        dots.forEach((dot) => {
            dot.classList.toggle('active', Number(dot.dataset.dot) <= n);
        });
    }

    // Клик по варианту ответа — сохраняем и переходим дальше
    card.querySelectorAll('.quiz-option').forEach((btn) => {
        btn.addEventListener('click', () => {
            const { field, value } = btn.dataset;
            answers[field] = value;

            // Подсвечиваем выбранный вариант среди соседей в этом шаге
            const step = btn.closest('.quiz-step');
            step.querySelectorAll('.quiz-option').forEach((b) => b.classList.remove('selected'));
            btn.classList.add('selected');

            const currentStep = Number(step.dataset.step);
            setTimeout(() => goToStep(currentStep + 1), 200);
        });
    });

    // Выбор канала отправки: Telegram или Max
    const channelButtons = card.querySelectorAll('.quiz-channel-option');
    const fineprint = document.getElementById('quiz-fineprint');
    const submitBtn = card.querySelector('.quiz-submit');

    function updateChannelUI() {
        channelButtons.forEach((b) => b.classList.toggle('selected', b.dataset.channel === channel));
        const consentLink = '<a href="privacy.html" target="_blank">согласие на обработку персональных данных</a>';
        if (channel === 'telegram') {
            fineprint.innerHTML = `Нажимая кнопку, вы даёте ${consentLink}. Сообщение откроется в Telegram — ничего никуда автоматически не отправляется без вашего подтверждения.`;
            submitBtn.textContent = 'Получить подборку →';
        } else {
            fineprint.innerHTML = `Нажимая кнопку, вы даёте ${consentLink}. Max пока не поддерживает готовые сообщения по ссылке — мы скопируем текст заявки в буфер обмена, откроется чат в Max, вставьте текст туда (Ctrl+V / long-tap → Вставить).`;
            submitBtn.textContent = 'Скопировать заявку и открыть Max →';
        }
    }

    channelButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            channel = btn.dataset.channel;
            updateChannelUI();
        });
    });

    updateChannelUI();

    // Кнопки "Назад"
    card.querySelectorAll('.quiz-back').forEach((btn) => {
        btn.addEventListener('click', () => {
            goToStep(Number(btn.dataset.back));
        });
    });

    // Всплывающее уведомление (тост)
    function showToast(message) {
        let toast = document.getElementById('quiz-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'quiz-toast';
            toast.className = 'quiz-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('visible');
        clearTimeout(showToast._timer);
        showToast._timer = setTimeout(() => {
            toast.classList.remove('visible');
        }, 2500);
    }

    // Финальная отправка
    const form = document.getElementById('quiz-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('quiz-name').value.trim();
            const phone = document.getElementById('quiz-phone').value.trim();

            const lines = [
                'Здравствуйте! Прошла(-ел) квиз на сайте, хочу подобрать квартиру.',
                answers.rooms ? `Интересует: ${answers.rooms}` : '',
                answers.budget ? `Бюджет: ${answers.budget}` : '',
                name ? `Имя: ${name}` : '',
                phone ? `Телефон: ${phone}` : ''
            ].filter(Boolean).join('\n');

            if (channel === 'telegram') {
                // У Telegram есть поддержка готового текста в ссылке — подставляем напрямую
                const url = `https://t.me/olya_blume?text=${encodeURIComponent(lines)}`;
                window.open(url, '_blank');
            } else {
                // Max пока не поддерживает текст в диплинке — копируем в буфер и открываем чат отдельно
                const maxUrl = 'https://max.ru/u/f9LHodD0cOKD9Wfy5uiVw2rCFxE56XOKsM2zfkwny18IveR99Hzgg6xTbGc';
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(lines)
                        .then(() => showToast('Текст скопирован!'))
                        .catch(() => showToast('Не удалось скопировать — скопируйте текст вручную'));
                } else {
                    showToast('Не удалось скопировать — скопируйте текст вручную');
                }
                window.open(maxUrl, '_blank');
            }
        });
    }
});

