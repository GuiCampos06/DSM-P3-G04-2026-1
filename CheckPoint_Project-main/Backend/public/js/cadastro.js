/* ============================================
   CHECKPOINT — cadastro.js
   Validação, UX e interações do formulário
   ============================================ */

(function () {
    'use strict';

    /* ── Referências ── */
    const form       = document.getElementById('register-form');
    const btnSubmit  = document.getElementById('btn-submit');
    const stepForm   = document.getElementById('step-form');
    const stepSuccess = document.getElementById('step-success');
    const displayNick = document.getElementById('display-nick');

    const fields = {
        nick:      { input: document.getElementById('username'),  error: document.getElementById('err-nick') },
        email:     { input: document.getElementById('email'),     error: document.getElementById('err-email') },
        cmail:     { input: document.getElementById('cmail'),     error: document.getElementById('err-cmail') },
        password:  { input: document.getElementById('password'),  error: document.getElementById('err-password') },
        cpassword: { input: document.getElementById('cpassword'), error: document.getElementById('err-cpassword') },
    };

    const termoCheck   = document.getElementById('termo');
    const errTermo     = document.getElementById('err-termo');
    const checkLabel   = document.querySelector('.check-label');

    /* ── Limpa erros ao digitar ── */
    Object.values(fields).forEach(({ input, error }) => {
        input.addEventListener('input', () => clearError(input, error));
    });

    termoCheck.addEventListener('change', () => {
        errTermo.textContent = '';
        errTermo.classList.remove('visible');
        checkLabel.classList.remove('error-check');
    });

    /* ══════════════════════════════════════════
       FORÇA DA SENHA
    ══════════════════════════════════════════ */
    const strengthWrap  = document.getElementById('strength-wrap');
    const segments      = [
        document.getElementById('seg1'),
        document.getElementById('seg2'),
        document.getElementById('seg3'),
        document.getElementById('seg4'),
    ];
    const strengthLabel = document.getElementById('strength-label');

    fields.password.input.addEventListener('input', updateStrength);

    function getStrength(pw) {
        let score = 0;
        if (pw.length >= 6)  score++;
        if (pw.length >= 10) score++;
        if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        return Math.min(score, 4);
    }

    function updateStrength() {
        const pw = fields.password.input.value;

        if (!pw) {
            strengthWrap.classList.remove('visible');
            segments.forEach(s => { s.className = 'strength-seg'; });
            strengthLabel.textContent = '';
            return;
        }

        strengthWrap.classList.add('visible');

        const score = getStrength(pw);
        const levels = ['', 'weak', 'fair', 'good', 'strong'];
        const labels = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];
        const colors = ['', '#e24b4a', '#f59e0b', '#7c00a8', '#10b981'];

        segments.forEach((s, i) => {
            s.className = 'strength-seg';
            if (i < score) s.classList.add(levels[score]);
        });

        strengthLabel.textContent = labels[score] || '';
        strengthLabel.style.color = colors[score] || '#71717a';
    }

    /* ══════════════════════════════════════════
       TOGGLE SENHA (mostrar/ocultar)
    ══════════════════════════════════════════ */
    document.querySelectorAll('.toggle-pw').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input    = document.getElementById(targetId);
            const eyeOpen  = btn.querySelector('.eye-open');
            const eyeOff   = btn.querySelector('.eye-off');

            if (input.type === 'password') {
                input.type   = 'text';
                eyeOpen.style.display = 'none';
                eyeOff.style.display  = 'block';
                btn.setAttribute('aria-label', 'Ocultar senha');
            } else {
                input.type   = 'password';
                eyeOpen.style.display = 'block';
                eyeOff.style.display  = 'none';
                btn.setAttribute('aria-label', 'Mostrar senha');
            }
        });
    });

    /* ══════════════════════════════════════════
       MODAL DE TERMOS
    ══════════════════════════════════════════ */
    const termsOverlay  = document.getElementById('terms-overlay');
    const openTermsBtn  = document.getElementById('open-terms');
    const closeTermsBtn = document.getElementById('close-terms');
    const acceptTermsBtn = document.getElementById('accept-terms');

    openTermsBtn.addEventListener('click', () => {
        termsOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    });

    function closeTerms() {
        termsOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    closeTermsBtn.addEventListener('click', closeTerms);

    acceptTermsBtn.addEventListener('click', () => {
        termoCheck.checked = true;
        termoCheck.dispatchEvent(new Event('change'));
        closeTerms();
    });

    termsOverlay.addEventListener('click', (e) => {
        if (e.target === termsOverlay) closeTerms();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeTerms();
    });

    /* ══════════════════════════════════════════
       VALIDAÇÃO
    ══════════════════════════════════════════ */
    function validate() {
        let ok = true;

        const nick      = fields.nick.input.value.trim();
        const email     = fields.email.input.value.trim();
        const cmail     = fields.cmail.input.value.trim();
        const password  = fields.password.input.value;
        const cpassword = fields.cpassword.input.value;

        /* Apelido */
        if (!nick) {
            showError(fields.nick.input, fields.nick.error, 'Informe um apelido.');
            ok = false;
        } else if (nick.length < 3) {
            showError(fields.nick.input, fields.nick.error, 'Apelido deve ter ao menos 3 caracteres.');
            ok = false;
        }

        /* E-mail */
        if (!email) {
            showError(fields.email.input, fields.email.error, 'Informe seu e-mail.');
            ok = false;
        } else if (!isValidEmail(email)) {
            showError(fields.email.input, fields.email.error, 'E-mail inválido.');
            ok = false;
        }

        /* Confirmar e-mail */
        if (!cmail) {
            showError(fields.cmail.input, fields.cmail.error, 'Confirme seu e-mail.');
            ok = false;
        } else if (email && cmail && email !== cmail) {
            showError(fields.cmail.input, fields.cmail.error, 'Os e-mails não coincidem.');
            ok = false;
        }

        /* Senha */
        if (!password) {
            showError(fields.password.input, fields.password.error, 'Crie uma senha.');
            ok = false;
        } else if (password.length < 6) {
            showError(fields.password.input, fields.password.error, 'Mínimo de 6 caracteres.');
            ok = false;
        }

        /* Confirmar senha */
        if (!cpassword) {
            showError(fields.cpassword.input, fields.cpassword.error, 'Confirme sua senha.');
            ok = false;
        } else if (password && cpassword && password !== cpassword) {
            showError(fields.cpassword.input, fields.cpassword.error, 'As senhas não coincidem.');
            ok = false;
        }

        /* Termos */
        if (!termoCheck.checked) {
            errTermo.textContent = 'Aceite os termos para continuar.';
            errTermo.classList.add('visible');
            checkLabel.classList.add('error-check');
            ok = false;
        }

        if (!ok) shakebtn();
        return ok;
    }

    /* ══════════════════════════════════════════
       SUBMIT
    ══════════════════════════════════════════ */
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validate()) return;
        sendForm();
    });

    function sendForm() {
        setLoading(true);

        /*
         * ── Integração com backend ──
         * Substitua o setTimeout pelo fetch real:
         *
         * const formData = new FormData(form);
         *
         * fetch('/users/cadastro', {
         *     method: 'POST',
         *     headers: { 'Content-Type': 'application/json' },
         *     body: JSON.stringify({
         *         Nick:  formData.get('Nick'),
         *         email: formData.get('email'),
         *         senha: formData.get('senha'),
         *     })
         * })
         * .then(res => res.json())
         * .then(data => {
         *     setLoading(false);
         *     if (data.success) {
         *         showSuccess(formData.get('Nick'));
         *     } else {
         *         showError(fields.nick.input, fields.nick.error, data.message || 'Erro ao criar conta.');
         *     }
         * })
         * .catch(() => {
         *     setLoading(false);
         *     showError(fields.nick.input, fields.nick.error, 'Erro de conexão. Tente novamente.');
         * });
         */

        /* Simulação — remova após integrar o backend */
        setTimeout(() => {
            setLoading(false);
            showSuccess(fields.nick.input.value.trim());
        }, 1800);
    }

    function showSuccess(nick) {
        displayNick.textContent = nick;
        stepForm.classList.add('hidden');
        stepSuccess.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* ══════════════════════════════════════════
       HELPERS
    ══════════════════════════════════════════ */
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
        void btnSubmit.offsetWidth;
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
