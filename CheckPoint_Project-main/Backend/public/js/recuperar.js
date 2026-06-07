/* ============================================
   CHECKPOINT — recuperar.js
   Validação e UX do formulário de recuperação
   ============================================ */

(function () {
    'use strict';

    const form      = document.getElementById('recover-form');
    const btnSubmit = document.getElementById('btn-submit');
    const stepForm  = document.getElementById('step-form');
    const stepSuccess = document.getElementById('step-success');
    const displayEmail = document.getElementById('display-email');

    const fields = {
        nick:  { input: document.getElementById('username'), error: document.getElementById('err-nick') },
        email: { input: document.getElementById('email'),    error: document.getElementById('err-email') },
        cmail: { input: document.getElementById('cmail'),    error: document.getElementById('err-cmail') },
    };

    /* ── Limpa erro ao digitar ── */
    Object.values(fields).forEach(({ input, error }) => {
        input.addEventListener('input', () => clearError(input, error));
    });

    /* ── Submit ── */
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validate()) return;
        sendCode();
    });

    /* ── Validação ── */
    function validate() {
        let ok = true;

        const nick  = fields.nick.input.value.trim();
        const email = fields.email.input.value.trim();
        const cmail = fields.cmail.input.value.trim();

        if (!nick) {
            showError(fields.nick.input, fields.nick.error, 'Informe seu apelido.');
            ok = false;
        }

        if (!email) {
            showError(fields.email.input, fields.email.error, 'Informe seu e-mail.');
            ok = false;
        } else if (!isValidEmail(email)) {
            showError(fields.email.input, fields.email.error, 'E-mail inválido.');
            ok = false;
        }

        if (!cmail) {
            showError(fields.cmail.input, fields.cmail.error, 'Confirme seu e-mail.');
            ok = false;
        } else if (email && cmail && email !== cmail) {
            showError(fields.cmail.input, fields.cmail.error, 'Os e-mails não coincidem.');
            ok = false;
        }

        if (!ok) shakebtn();
        return ok;
    }

    /* ── Simula envio (substitua pelo fetch real) ── */
    function sendCode() {
        setLoading(true);

        /* 
         * Substituir pelo fetch real:
         *
         * fetch('/users/recuperar', {
         *     method: 'POST',
         *     headers: { 'Content-Type': 'application/json' },
         *     body: JSON.stringify({
         *         Nick:  fields.nick.input.value.trim(),
         *         Email: fields.email.input.value.trim(),
         *     })
         * })
         * .then(res => res.json())
         * .then(data => {
         *     setLoading(false);
         *     showSuccess(fields.email.input.value.trim());
         * })
         * .catch(() => {
         *     setLoading(false);
         *     showGlobalError('Erro ao enviar. Tente novamente.');
         * });
         */

        /* Simulação: remove após integrar o backend */
        setTimeout(() => {
            setLoading(false);
            showSuccess(fields.email.input.value.trim());
        }, 1800);
    }

    /* ── Exibe step de sucesso ── */
    function showSuccess(email) {
        displayEmail.textContent = email;
        stepForm.classList.add('hidden');
        stepSuccess.classList.remove('hidden');
    }

    /* ── Reseta para o formulário (chamado pelo botão "Tentar outro e-mail") ── */
    window.resetForm = function () {
        fields.nick.input.value  = '';
        fields.email.input.value = '';
        fields.cmail.input.value = '';
        stepSuccess.classList.add('hidden');
        stepForm.classList.remove('hidden');
    };

    /* ── Helpers ── */
    function showError(input, errorEl, msg) {
        input.classList.add('error');
        errorEl.textContent = msg;
        errorEl.classList.add('visible');
    }

    function clearError(input, errorEl) {
        input.classList.remove('error');
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
    }

    function shakebtn() {
        btnSubmit.classList.remove('shake');
        void btnSubmit.offsetWidth; /* reflow para reiniciar animação */
        btnSubmit.classList.add('shake');
        btnSubmit.addEventListener('animationend', () => btnSubmit.classList.remove('shake'), { once: true });
    }

    function setLoading(state) {
        btnSubmit.classList.toggle('loading', state);
        btnSubmit.disabled = state;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

})();