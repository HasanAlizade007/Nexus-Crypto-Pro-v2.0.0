document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. TAB KEÇİDİ (Login və Register arasında keçid) ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');

    // Əgər sənin HTML-də .tab-btn yoxdursa, id-lər üzərindən keçid:
    const goReg = document.getElementById('go-to-reg');
    const goLog = document.getElementById('go-to-login');
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');

    if(goReg) {
        goReg.onclick = () => {
            loginSection.style.display = 'none';
            registerSection.style.display = 'block';
        };
    }
    if(goLog) {
        goLog.onclick = () => {
            registerSection.style.display = 'none';
            loginSection.style.display = 'block';
        };
    }

    // --- 2. ŞİFRƏNİ GÖSTƏR / GİZLƏ ---
    document.querySelectorAll('.toggle-pass').forEach(icon => {
        icon.addEventListener('click', function() {
            const input = this.previousElementSibling; 
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });

    // --- 3. QEYDİYYAT FORMASI (Məcburi Login Məntiqi) ---
    const btnRegister = document.getElementById('btn-register');
    
    if (btnRegister) {
        btnRegister.addEventListener('click', () => {
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const pass = document.getElementById('reg-pass').value;

            if (!name || !email || !pass) {
                alert("Zəhmət olmasa bütün xanaları doldurun!");
                return;
            }

            // Bütün istifadəçilər siyahısını götür
            let allUsers = JSON.parse(localStorage.getItem('nexusUsers')) || [];

            // Email yoxlanışı
            if (allUsers.find(u => u.email === email)) {
                alert("Bu e-poçt artıq qeydiyyatdan keçib!");
                return;
            }

            // Yeni istifadəçini massivə əlavə et
            const newUser = {
                name: name,
                email: email,
                password: pass,
                avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`
            };

            allUsers.push(newUser);
            localStorage.setItem('nexusUsers', JSON.stringify(allUsers));

            // Vizual effekt
            btnRegister.innerHTML = '<i class="fa-solid fa-check"></i> Uğurlu! Yönləndirilir...';
            btnRegister.style.background = "var(--success)";

            // 1.5 saniyə sonra LOGIN bölməsinə keçid (index.html-ə YOX)
            setTimeout(() => {
                alert("Qeydiyyat tamamlandı! İndi daxil olun.");
                registerSection.style.display = 'none';
                loginSection.style.display = 'block';
                // Düyməni əvvəlki halına qaytar
                btnRegister.innerText = "Qeydiyyatı Tamamla";
                btnRegister.style.background = "var(--accent)";
            }, 1500);
        });
    }

    // --- 4. GİRİŞ FORMASI ---
    const btnLogin = document.getElementById('btn-login');
    
    if (btnLogin) {
        btnLogin.addEventListener('click', () => {
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;

            // Bütün istifadəçiləri bazadan çək
            let allUsers = JSON.parse(localStorage.getItem('nexusUsers')) || [];
            
            // İstifadəçini tap
            const user = allUsers.find(u => u.email === email && u.password === pass);

            if (user) {
                // Aktiv sessiya yarat
                localStorage.setItem('currentUser', JSON.stringify(user));

                btnLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Giriş edilir...';

                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1200);
            } else {
                alert("E-poçt və ya şifrə yanlışdır!");
            }
        });
    }
});