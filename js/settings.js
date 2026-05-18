document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'auth.html';
        return;
    }

    // Fill profile fields
    document.getElementById('header-username').innerText = user.name;
    document.getElementById('header-avatar').src = user.avatar;
    document.getElementById('preview-img').src = user.avatar;
    document.getElementById('set-name').value = user.name;
    document.getElementById('set-email').value = user.email || '';

    // Load all toggle & color states
    loadToggles();
    syncColorPicker();

    // Re-sync when language changes
    window.__i18nRerender = function() {
        syncLangPick();
    };
    syncLangPick();

    // Avatar preview
    document.getElementById('file-upload').addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                document.getElementById('preview-img').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Save profile
    document.getElementById('save-all').addEventListener('click', () => {
        const nameVal = document.getElementById('set-name').value.trim();
        if (!nameVal) { showSettingsToast('⚠️ Ad boş ola bilməz!', 'danger'); return; }

        user.name = nameVal;
        user.email = document.getElementById('set-email').value.trim();
        user.avatar = document.getElementById('preview-img').src;
        localStorage.setItem('currentUser', JSON.stringify(user));

        const btn = document.getElementById('save-all');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> ' + (window.t ? window.t('saved_ok') : 'Yadda saxlanıldı!');
        btn.style.background = 'var(--success)';
        btn.style.color = '#000';
        setTimeout(() => {
            btn.innerHTML = window.t ? window.t('save_changes') : 'Dəyişiklikləri Yadda Saxla';
            btn.style.background = '';
            btn.style.color = '';
        }, 2000);
    });

    // Logout
    const logout = () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'auth.html';
    };
    document.getElementById('final-logout').addEventListener('click', logout);
    document.getElementById('logout-sidebar').addEventListener('click', logout);
});

// ─── TOGGLES ──────────────────────────────────────────────
function loadToggles() {
    const prefs = getPrefs();
    // Notification toggles: default ON
    ['notif_price', 'notif_news', 'notif_trade'].forEach(key => {
        const el = document.getElementById('toggle-' + key.replace(/_/g, '-'));
        if (el) el.checked = prefs[key] !== false;
    });
    // Privacy: hide_balance default OFF
    const hb = document.getElementById('toggle-hide-balance');
    if (hb) hb.checked = !!prefs.hide_balance;
}

function saveToggle(key, value) {
    const prefs = getPrefs();
    prefs[key] = value;
    setPrefs(prefs);

    const msgs = {
        notif_price: value ? '🔔 Qiymət xəbərdarlıqları aktiv' : '🔕 Qiymət xəbərdarlıqları söndürüldü',
        notif_news:  value ? '📰 Xəbər bildirişləri aktiv'     : '📰 Xəbər bildirişləri söndürüldü',
        notif_trade: value ? '📊 Əməliyyat bildirişləri aktiv' : '📊 Əməliyyat bildirişləri söndürüldü',
        hide_balance: value ? '🔒 Balans gizlədildi'           : '👁️ Balans göstərilir',
    };
    showSettingsToast(msgs[key] || '✅ Yadda saxlanıldı');
}

// ─── ACCENT COLOR ─────────────────────────────────────────
function selectAccentColor(hex, btn) {
    applyAccentColor(hex);
    const prefs = getPrefs();
    prefs.accent_color = hex;
    setPrefs(prefs);
    syncColorPicker();
    showSettingsToast('🎨 Rəng dəyişdirildi');
}

function applyAccentColor(hex) {
    if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    document.documentElement.style.setProperty('--accent', hex);
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    document.documentElement.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.3)`);
}

function syncColorPicker() {
    const prefs = getPrefs();
    const active = prefs.accent_color || '#3d6eff';
    document.querySelectorAll('.color-swatch').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === active);
    });
}

// ─── LANGUAGE PICKER ─────────────────────────────────────
function syncLangPick() {
    const lang = window.getCurrentLang ? window.getCurrentLang() : (localStorage.getItem('nexusLang') || 'az');
    document.querySelectorAll('[data-langpick]').forEach(btn => {
        btn.classList.toggle('lang-pick-active', btn.dataset.langpick === lang);
    });
}

// ─── TOAST ────────────────────────────────────────────────
function showSettingsToast(msg, type) {
    const existing = document.querySelector('.settings-toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'settings-toast';
    if (type === 'danger') el.style.borderColor = 'var(--danger)';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.3s';
        setTimeout(() => el.remove(), 300);
    }, 2500);
}

// ─── HELPERS ──────────────────────────────────────────────
function getPrefs() {
    return JSON.parse(localStorage.getItem('nexusPrefs') || '{}');
}
function setPrefs(prefs) {
    localStorage.setItem('nexusPrefs', JSON.stringify(prefs));
}
