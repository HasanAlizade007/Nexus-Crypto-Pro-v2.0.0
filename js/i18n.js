// Apply accent color immediately (before page renders)
(function () {
    try {
        var prefs = JSON.parse(localStorage.getItem('nexusPrefs') || '{}');
        var hex = prefs.accent_color;
        if (hex && /^#[0-9a-fA-F]{6}$/.test(hex)) {
            document.documentElement.style.setProperty('--accent', hex);
            var r = parseInt(hex.slice(1, 3), 16);
            var g = parseInt(hex.slice(3, 5), 16);
            var b = parseInt(hex.slice(5, 7), 16);
            document.documentElement.style.setProperty('--accent-glow', 'rgba(' + r + ',' + g + ',' + b + ',0.3)');
        }
    } catch (e) {}
})();

// ============================================================
// Nexus Pro — Çoxdilli Sistem (AZ / EN / RU)
// ============================================================
window.i18n = {
    az: {
        // Naviqasiya
        dashboard: 'Dashboard',
        market: 'Bazar Analizi',
        wallet: 'Pulqabı',
        watchlist: 'İzləmə Siyahısı',
        news: 'Krypto Xəbərləri',
        converter: 'Konverter',
        trading: 'Trading',
        settings: 'Parametrlər',
        login_reg: 'Giriş / Qeydiyyat',
        login: 'Giriş Et',
        menu_main: 'ƏSAS',
        menu_account: 'HESAB',
        home: 'Ana',
        watch: 'İzlə',
        sidebar_logout: 'Çıxış',
        // Axtarış
        search_placeholder: 'Kripto axtar (məs: BTC)...',
        market_search_placeholder: 'Kripto axtarın...',
        add_coin_placeholder: 'Koin əlavə et...',
        // Sidebar Premium
        premium_text: 'Premium-a keçid et!',
        upgrade_btn: '⚡ Yüksəlt',
        // Dashboard
        portfolio_perf: 'Portfelin Gəlirliliyi',
        total_balance: 'Ümumi Balans',
        vol_24h: '24s Həcm',
        live_prices: 'Canlı Kripto Qiymətləri',
        top_gainer: 'Ən Çox Qazanan',
        top_loser: 'Ən Çox İtirən',
        price_alerts: 'Qiymət Xəbərdarlıqları',
        new_alert_btn: '+ Yeni Xəbərdarlıq',
        no_alerts: 'Hələ heç bir xəbərdarlıq yaradılmayıb.',
        // Bazar
        market_subtitle: 'Canlı kriptovalyuta qiymətləri və bazar məlumatları',
        total_market_cap: 'Ümumi Bazar Kapitalı',
        vol_24h_market: '24 saatlıq həcm',
        btc_dominance: 'BTC Dominantlığı',
        active_cryptos: 'Aktiv Kriptovalyutalar',
        live_label: 'Canlı',
        filter_all: 'Hamısı',
        col_asset: 'AKTİV',
        col_price: 'QİYMƏT',
        col_change: '24S DEYİŞİM',
        col_mcap: 'BAZAR DƏYƏRİ',
        col_action: 'HƏRƏKƏT',
        // Pulqabı
        your_wallet: 'Sizin Pulqabınız',
        total_assets: 'Ümumi Aktivlər (Koinlər)',
        cash_balance: 'Mövcud Nağd Balans',
        only_investments: 'Sadəcə İnvestisiyalar',
        add_balance: 'Balansı Artır',
        reset: 'Sıfırla',
        pnl_total: 'Ümumi Gəlir / Zərər',
        best_trade: 'Ən Yaxşı Alış',
        operations: 'Əməliyyatlar',
        portfolio_value: 'Portfolio Dəyəri',
        current_assets: 'Mövcud Aktivləriniz',
        recent_tx: 'Son Əməliyyatlar',
        empty_portfolio: 'Portfeliniz boşdur. Koin almağa başlayın!',
        no_transactions: 'Hələ heç bir əməliyyat yoxdur.',
        // İzləmə siyahısı
        watchlist_subtitle: 'Sevdiyiniz koinləri izləyin',
        watchlist_empty: 'İzləmə siyahınız boşdur.',
        watchlist_empty_desc: 'Koin kartlarındaki ⭐ düyməsindən əlavə edin.',
        added_watchlist: 'İzləmə siyahısına əlavə edildi ⭐',
        removed_watchlist: 'İzləmə siyahısından çıxarıldı',
        // Xəbərlər
        news_subtitle: 'Ən son bazar hadisələri',
        news_tag_general: 'Ümumi',
        // Konverter
        converter_subtitle: 'Real vaxtda qiymət çevirmə',
        amount_label: 'Məbləğ',
        source_label: 'Mənbə',
        result_label: 'Nəticə',
        target_label: 'Hədəf',
        popular_pairs: 'Populyar Cütlər',
        // Koin kartı
        market_cap_label: 'Bazar Dəyəri',
        volume_label: 'Həcm',
        balance_label: 'Balans',
        buy_btn: 'Al',
        sell_btn: 'Sat',
        add_watchlist_title: 'İzləməyə Əlavə Et',
        remove_watchlist_title: 'İzləmədən Çıxar',
        // Ticarət modalı
        current_price_label: 'CARİ QİYMƏT',
        cash_bal_modal: 'Nağd Balans',
        available_coin: 'Mövcud Koin',
        quantity_label: 'Miqdar',
        total_value_label: 'Ümumi Dəyər',
        confirm_btn: 'Təsdiqlə',
        buy_order: '▲ Alış Əməliyyatı',
        sell_order: '▼ Satış Əməliyyatı',
        // Xəbərdarlıq modalı
        create_alert_title: 'Qiymət Xəbərdarlığı Yarat',
        select_coin: 'Koin Seçin',
        condition_label: 'Şərt',
        above_label: 'Yuxarı keçəndə (>)',
        below_label: 'Aşağı düşəndə (<)',
        price_usd_label: 'Qiymət ($)',
        create_btn: 'Xəbərdarlıq Yarat',
        above_cond: 'Yuxarı keçəndə',
        below_cond: 'Aşağı düşəndə',
        alert_triggered: 'Tetikləndi',
        // Aktiv sütunları
        qty_col: 'MİQDAR',
        avg_price_col: 'ORTA QİYMƏT',
        value_col: 'DƏYƏR',
        // Qorxu & Tamah
        extreme_fear: 'Həddindən artıq Qorxu',
        fear: 'Qorxu',
        neutral: 'Neytral',
        greed: 'Tamah',
        extreme_greed: 'Həddindən artıq Tamah',
        market_mood: 'Bazar əhval-ruhiyyəsi',
        loading: 'Yüklənir',
        // Əməliyyat tarixçəsi
        buy_tx: 'Alış',
        sell_tx: 'Satış',
        // Xəbərdarlıqlar
        alert_created: 'Xəbərdarlıq yaradıldı! 🔔',
        alert_above: 'yuxarı keçdi',
        alert_below: 'aşağı düşdü',
        no_coin_owned: 'Bu koindən sahib deyilsiniz!',
        api_error: 'API məlumatları yüklənə bilmədi. Yenidən cəhd edilir...',
        // Balans əlavəsi
        enter_amount: 'Əlavə etmək istədiyiniz məbləği daxil edin ($):',
        reset_confirm: 'Sıfırlamaq istədiyinizə əminsiniz? Bütün aktivlər silinəcək!',
        invalid_input: 'Düzgün məlumat daxil edin!',
        invalid_amount: '⚠️ Düzgün miqdar daxil edin!',
        insufficient_balance: '⚠️ Balansınız çatmır! Lazım:',
        insufficient_coins: '⚠️ Kifayət qədər koin yoxdur! Mövcud:',
        buy_success: 'uğurla alındı!',
        sell_success: 'uğurla satıldı!',
        // Sazlamalar
        settings_title: 'Hesab Sazlamaları',
        profile_section: 'Profili Yenilə',
        full_name: 'Ad Soyad',
        email_label: 'E-poçt (Gmail)',
        choose_photo: 'Şəkil Seç',
        save_changes: 'Dəyişiklikləri Yadda Saxla',
        saved_ok: 'Yadda saxlanıldı!',
        account_status: 'Hesab Statusu',
        verified: 'Doğrulanmış Hesab',
        danger_zone: 'Təhlükəli Zona',
        danger_desc: 'Hesabdan çıxış etmək üçün aşağıdakı düyməni istifadə edin.',
        logout: 'Çıxış Et',
        // Sazlamalar — Görünüş
        appearance_title: 'Görünüş',
        theme_label: 'Tema',
        theme_dark: 'Tünd',
        theme_light: 'Açıq (Tezliklə)',
        // Sazlamalar — Dil
        language_title: 'Dil Seçimi',
        language_desc: 'İnterfeys dilini seçin',
        // Sazlamalar — Bildirişlər
        notifications_title: 'Bildirişlər',
        notif_price: 'Qiymət Xəbərdarlıqları',
        notif_price_desc: 'Qiymət həddinə çatdıqda bildiriş al',
        notif_news: 'Xəbər Bildirişləri',
        notif_news_desc: 'Son kripto xəbərlərini izlə',
        notif_trade: 'Əməliyyat Bildirişləri',
        notif_trade_desc: 'Alış/Satış əməliyyatlarından sonra bildiriş',
        // Sazlamalar — Gizlilik
        privacy_title: 'Gizlilik',
        hide_balance: 'Balansı Gizlət',
        hide_balance_desc: 'Balans dəyərlərini avtomatik gizlət',
        two_factor: '2FA Doğrulaması',
        two_factor_desc: 'İki faktorlu doğrulama (tezliklə)',
        // Sazlamalar — Haqqında
        about_title: 'Haqqında',
        app_name_label: 'Proqram',
        app_version_label: 'Versiya',
        data_source_label: 'Məlumat Mənbəyi',
    },
    en: {
        dashboard: 'Dashboard',
        market: 'Market Analysis',
        wallet: 'Wallet',
        watchlist: 'Watchlist',
        news: 'Crypto News',
        converter: 'Converter',
        trading: 'Trading',
        settings: 'Settings',
        login_reg: 'Login / Register',
        login: 'Login',
        menu_main: 'MAIN',
        menu_account: 'ACCOUNT',
        home: 'Home',
        watch: 'Watch',
        sidebar_logout: 'Logout',
        search_placeholder: 'Search crypto (e.g. BTC)...',
        market_search_placeholder: 'Search crypto...',
        add_coin_placeholder: 'Add coin...',
        premium_text: 'Upgrade to Premium!',
        upgrade_btn: '⚡ Upgrade',
        portfolio_perf: 'Portfolio Performance',
        total_balance: 'Total Balance',
        vol_24h: '24h Volume',
        live_prices: 'Live Crypto Prices',
        top_gainer: 'Top Gainer',
        top_loser: 'Top Loser',
        price_alerts: 'Price Alerts',
        new_alert_btn: '+ New Alert',
        no_alerts: 'No alerts created yet.',
        market_subtitle: 'Live cryptocurrency prices and market data',
        total_market_cap: 'Total Market Cap',
        vol_24h_market: '24h Volume',
        btc_dominance: 'BTC Dominance',
        active_cryptos: 'Active Cryptocurrencies',
        live_label: 'Live',
        filter_all: 'All',
        col_asset: 'ASSET',
        col_price: 'PRICE',
        col_change: '24H CHANGE',
        col_mcap: 'MARKET CAP',
        col_action: 'ACTION',
        your_wallet: 'Your Wallet',
        total_assets: 'Total Assets (Coins)',
        cash_balance: 'Available Cash Balance',
        only_investments: 'Investments Only',
        add_balance: 'Add Balance',
        reset: 'Reset',
        pnl_total: 'Total P&L',
        best_trade: 'Best Trade',
        operations: 'Transactions',
        portfolio_value: 'Portfolio Value',
        current_assets: 'Your Assets',
        recent_tx: 'Recent Transactions',
        empty_portfolio: 'Your portfolio is empty. Start buying coins!',
        no_transactions: 'No transactions yet.',
        watchlist_subtitle: 'Track your favorite coins',
        watchlist_empty: 'Your watchlist is empty.',
        watchlist_empty_desc: 'Add coins using the ⭐ button on coin cards.',
        added_watchlist: 'Added to watchlist ⭐',
        removed_watchlist: 'Removed from watchlist',
        news_subtitle: 'Latest market events',
        news_tag_general: 'General',
        converter_subtitle: 'Real-time price conversion',
        amount_label: 'Amount',
        source_label: 'Source',
        result_label: 'Result',
        target_label: 'Target',
        popular_pairs: 'Popular Pairs',
        market_cap_label: 'Market Cap',
        volume_label: 'Volume',
        balance_label: 'Balance',
        buy_btn: 'Buy',
        sell_btn: 'Sell',
        add_watchlist_title: 'Add to Watchlist',
        remove_watchlist_title: 'Remove from Watchlist',
        current_price_label: 'CURRENT PRICE',
        cash_bal_modal: 'Cash Balance',
        available_coin: 'Available Coin',
        quantity_label: 'Quantity',
        total_value_label: 'Total Value',
        confirm_btn: 'Confirm',
        buy_order: '▲ Buy Order',
        sell_order: '▼ Sell Order',
        create_alert_title: 'Create Price Alert',
        select_coin: 'Select Coin',
        condition_label: 'Condition',
        above_label: 'Goes above (>)',
        below_label: 'Goes below (<)',
        price_usd_label: 'Price ($)',
        create_btn: 'Create Alert',
        above_cond: 'Goes above',
        below_cond: 'Goes below',
        alert_triggered: 'Triggered',
        qty_col: 'AMOUNT',
        avg_price_col: 'AVG PRICE',
        value_col: 'VALUE',
        extreme_fear: 'Extreme Fear',
        fear: 'Fear',
        neutral: 'Neutral',
        greed: 'Greed',
        extreme_greed: 'Extreme Greed',
        market_mood: 'Market Sentiment',
        loading: 'Loading',
        buy_tx: 'Buy',
        sell_tx: 'Sell',
        alert_created: 'Alert created! 🔔',
        alert_above: 'went above',
        alert_below: 'went below',
        no_coin_owned: "You don't own this coin!",
        api_error: 'Failed to load API data. Retrying...',
        enter_amount: 'Enter the amount to add ($):',
        reset_confirm: 'Are you sure? All assets will be deleted!',
        invalid_input: 'Invalid input!',
        invalid_amount: '⚠️ Enter a valid amount!',
        insufficient_balance: '⚠️ Insufficient balance! Need:',
        insufficient_coins: '⚠️ Not enough coins! Available:',
        buy_success: 'successfully bought!',
        sell_success: 'successfully sold!',
        settings_title: 'Account Settings',
        profile_section: 'Update Profile',
        full_name: 'Full Name',
        email_label: 'Email (Gmail)',
        choose_photo: 'Choose Photo',
        save_changes: 'Save Changes',
        saved_ok: 'Saved!',
        account_status: 'Account Status',
        verified: 'Verified Account',
        danger_zone: 'Danger Zone',
        danger_desc: 'Use the button below to logout from your account.',
        logout: 'Logout',
        appearance_title: 'Appearance',
        theme_label: 'Theme',
        theme_dark: 'Dark',
        theme_light: 'Light (Coming Soon)',
        language_title: 'Language',
        language_desc: 'Choose interface language',
        notifications_title: 'Notifications',
        notif_price: 'Price Alerts',
        notif_price_desc: 'Get notified when price target is hit',
        notif_news: 'News Notifications',
        notif_news_desc: 'Follow the latest crypto news',
        notif_trade: 'Trade Notifications',
        notif_trade_desc: 'Notify after buy/sell transactions',
        privacy_title: 'Privacy',
        hide_balance: 'Hide Balance',
        hide_balance_desc: 'Automatically hide balance values',
        two_factor: '2FA Authentication',
        two_factor_desc: 'Two-factor authentication (coming soon)',
        about_title: 'About',
        app_name_label: 'Application',
        app_version_label: 'Version',
        data_source_label: 'Data Source',
    },
    ru: {
        dashboard: 'Дашборд',
        market: 'Анализ рынка',
        wallet: 'Кошелёк',
        watchlist: 'Список наблюдения',
        news: 'Крипто Новости',
        converter: 'Конвертер',
        trading: 'Трейдинг',
        settings: 'Настройки',
        login_reg: 'Вход / Регистрация',
        login: 'Войти',
        menu_main: 'ГЛАВНОЕ',
        menu_account: 'АККАУНТ',
        home: 'Главная',
        watch: 'Слежка',
        sidebar_logout: 'Выйти',
        search_placeholder: 'Найти криптовалюту...',
        market_search_placeholder: 'Найти криптовалюту...',
        add_coin_placeholder: 'Добавить монету...',
        premium_text: 'Перейти на Премиум!',
        upgrade_btn: '⚡ Улучшить',
        portfolio_perf: 'Доходность Портфеля',
        total_balance: 'Общий Баланс',
        vol_24h: 'Объём 24ч',
        live_prices: 'Живые Цены Криптовалют',
        top_gainer: 'Лидер Роста',
        top_loser: 'Лидер Падения',
        price_alerts: 'Ценовые Оповещения',
        new_alert_btn: '+ Новое Оповещение',
        no_alerts: 'Оповещения ещё не созданы.',
        market_subtitle: 'Живые цены криптовалют и рыночные данные',
        total_market_cap: 'Общая Капитализация',
        vol_24h_market: 'Объём за 24ч',
        btc_dominance: 'Доминация BTC',
        active_cryptos: 'Активные Криптовалюты',
        live_label: 'Живой',
        filter_all: 'Все',
        col_asset: 'АКТИВ',
        col_price: 'ЦЕНА',
        col_change: '24Ч ИЗМЕНЕНИЕ',
        col_mcap: 'КАП. РЫНКА',
        col_action: 'ДЕЙСТВИЕ',
        your_wallet: 'Ваш Кошелёк',
        total_assets: 'Общие Активы (Монеты)',
        cash_balance: 'Доступный Баланс',
        only_investments: 'Только Инвестиции',
        add_balance: 'Пополнить',
        reset: 'Сбросить',
        pnl_total: 'Общий P&L',
        best_trade: 'Лучшая Сделка',
        operations: 'Операции',
        portfolio_value: 'Стоимость Портфеля',
        current_assets: 'Ваши Активы',
        recent_tx: 'Последние Транзакции',
        empty_portfolio: 'Ваш портфель пуст. Начните покупать монеты!',
        no_transactions: 'Транзакций пока нет.',
        watchlist_subtitle: 'Следите за любимыми монетами',
        watchlist_empty: 'Список наблюдения пуст.',
        watchlist_empty_desc: 'Добавляйте монеты с помощью кнопки ⭐.',
        added_watchlist: 'Добавлено в список ⭐',
        removed_watchlist: 'Удалено из списка',
        news_subtitle: 'Последние рыночные события',
        news_tag_general: 'Общее',
        converter_subtitle: 'Конвертация цен в реальном времени',
        amount_label: 'Сумма',
        source_label: 'Источник',
        result_label: 'Результат',
        target_label: 'Цель',
        popular_pairs: 'Популярные Пары',
        market_cap_label: 'Кап. рынка',
        volume_label: 'Объём',
        balance_label: 'Баланс',
        buy_btn: 'Купить',
        sell_btn: 'Продать',
        add_watchlist_title: 'Добавить в список',
        remove_watchlist_title: 'Удалить из списка',
        current_price_label: 'ТЕКУЩАЯ ЦЕНА',
        cash_bal_modal: 'Кэш Баланс',
        available_coin: 'Доступно Монет',
        quantity_label: 'Количество',
        total_value_label: 'Итоговая Стоимость',
        confirm_btn: 'Подтвердить',
        buy_order: '▲ Ордер на Покупку',
        sell_order: '▼ Ордер на Продажу',
        create_alert_title: 'Создать Ценовое Оповещение',
        select_coin: 'Выберите Монету',
        condition_label: 'Условие',
        above_label: 'Поднимется выше (>)',
        below_label: 'Упадёт ниже (<)',
        price_usd_label: 'Цена ($)',
        create_btn: 'Создать Оповещение',
        above_cond: 'Поднялся выше',
        below_cond: 'Упал ниже',
        alert_triggered: 'Сработало',
        qty_col: 'КОЛИЧЕСТВО',
        avg_price_col: 'СР. ЦЕНА',
        value_col: 'СТОИМОСТЬ',
        extreme_fear: 'Экстремальный Страх',
        fear: 'Страх',
        neutral: 'Нейтральный',
        greed: 'Жадность',
        extreme_greed: 'Экстремальная Жадность',
        market_mood: 'Настроение Рынка',
        loading: 'Загрузка',
        buy_tx: 'Покупка',
        sell_tx: 'Продажа',
        alert_created: 'Оповещение создано! 🔔',
        alert_above: 'поднялся выше',
        alert_below: 'упал ниже',
        no_coin_owned: 'У вас нет этой монеты!',
        api_error: 'Не удалось загрузить данные API. Повтор...',
        enter_amount: 'Введите сумму для добавления ($):',
        reset_confirm: 'Вы уверены? Все активы будут удалены!',
        invalid_input: 'Неверные данные!',
        invalid_amount: '⚠️ Введите правильное количество!',
        insufficient_balance: '⚠️ Недостаточный баланс! Нужно:',
        insufficient_coins: '⚠️ Недостаточно монет! Доступно:',
        buy_success: 'успешно куплено!',
        sell_success: 'успешно продано!',
        settings_title: 'Настройки Аккаунта',
        profile_section: 'Обновить Профиль',
        full_name: 'Полное имя',
        email_label: 'E-mail (Gmail)',
        choose_photo: 'Выбрать Фото',
        save_changes: 'Сохранить Изменения',
        saved_ok: 'Сохранено!',
        account_status: 'Статус Аккаунта',
        verified: 'Подтверждённый Аккаунт',
        danger_zone: 'Опасная Зона',
        danger_desc: 'Используйте кнопку ниже для выхода из аккаунта.',
        logout: 'Выйти',
        appearance_title: 'Внешний вид',
        theme_label: 'Тема',
        theme_dark: 'Тёмная',
        theme_light: 'Светлая (Скоро)',
        language_title: 'Язык',
        language_desc: 'Выберите язык интерфейса',
        notifications_title: 'Уведомления',
        notif_price: 'Ценовые Оповещения',
        notif_price_desc: 'Получать уведомления при достижении цены',
        notif_news: 'Новостные Уведомления',
        notif_news_desc: 'Следить за последними новостями крипто',
        notif_trade: 'Торговые Уведомления',
        notif_trade_desc: 'Уведомления после операций покупки/продажи',
        privacy_title: 'Конфиденциальность',
        hide_balance: 'Скрыть Баланс',
        hide_balance_desc: 'Автоматически скрывать значения баланса',
        two_factor: '2FA Аутентификация',
        two_factor_desc: 'Двухфакторная аутентификация (скоро)',
        about_title: 'О программе',
        app_name_label: 'Приложение',
        app_version_label: 'Версия',
        data_source_label: 'Источник данных',
    }
};

// ----------------------------------------------------------------
// Core helpers
// ----------------------------------------------------------------
let _currentLang = localStorage.getItem('nexusLang') || 'az';

window.t = function(key) {
    return (window.i18n[_currentLang] && window.i18n[_currentLang][key])
        || (window.i18n.az[key])
        || key;
};

window.getCurrentLang = function() { return _currentLang; };

window.applyLanguage = function(lang) {
    _currentLang = lang;
    localStorage.setItem('nexusLang', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = window.t(key);
        if (val) el.textContent = val;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const val = window.t(key);
        if (val) el.placeholder = val;
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const val = window.t(key);
        if (val) el.title = val;
    });

    const langCurrent = document.getElementById('lang-current');
    if (langCurrent) langCurrent.textContent = lang.toUpperCase();

    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.lang === lang);
    });

    // Re-render dynamic content
    window.__i18nRerender && window.__i18nRerender();
};

window.setLanguage = function(lang) {
    window.applyLanguage(lang);
    window.closeLangDropdown && window.closeLangDropdown();
};

window.toggleLangDropdown = function() {
    const dd = document.getElementById('lang-dropdown');
    const ch = document.getElementById('lang-chevron');
    if (!dd) return;
    const isOpen = dd.classList.contains('open');
    dd.classList.toggle('open', !isOpen);
    if (ch) ch.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
};

window.closeLangDropdown = function() {
    const dd = document.getElementById('lang-dropdown');
    const ch = document.getElementById('lang-chevron');
    if (dd) dd.classList.remove('open');
    if (ch) ch.style.transform = 'rotate(0deg)';
};

document.addEventListener('click', function(e) {
    const sel = document.getElementById('lang-selector');
    if (sel && !sel.contains(e.target)) window.closeLangDropdown();
});

document.addEventListener('DOMContentLoaded', function() {
    window.applyLanguage(_currentLang);
});
