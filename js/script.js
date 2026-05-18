document.addEventListener('DOMContentLoaded', () => {

    // =====================================================
    // STATE
    // =====================================================
    let cryptoData = [];
    let currentIndex = 0;
    let myPortfolioChart = null;
    let watchlist = JSON.parse(localStorage.getItem('nexusWatchlist')) || ['bitcoin', 'ethereum', 'solana'];
    let priceAlerts = JSON.parse(localStorage.getItem('nexusAlerts')) || [];
    let txHistory = JSON.parse(localStorage.getItem('nexusTxHistory')) || [];
    let wallet = JSON.parse(localStorage.getItem('nexusWallet')) || { cash: 0, assets: {}, costBasis: {} };
    let portfolioHistory = JSON.parse(localStorage.getItem('nexusPortfolioHistory')) || [];

    // =====================================================
    // NAVIGATION
    // =====================================================
    document.querySelectorAll('.nav-link[data-target]').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            link.classList.add('active');
            const target = document.getElementById(link.dataset.target);
            if (target) {
                target.classList.add('active');
                if (link.dataset.target === 'dash') setTimeout(initPortfolioChart, 100);
                if (link.dataset.target === 'watchlist') renderWatchlist();
                if (link.dataset.target === 'news') loadNews();
                if (link.dataset.target === 'converter') initConverter();
                if (link.dataset.target === 'trading') {
                    document.querySelector('.main-content').classList.add('trading-mode');
                    setTimeout(openTradingTerminal, 100);
                } else {
                    document.querySelector('.main-content').classList.remove('trading-mode');
                }
            }
        });
    });

    // =====================================================
    // i18n RE-RENDER HOOK
    // =====================================================
    window.__i18nRerender = function() {
        if (cryptoData && cryptoData.length > 0) {
            renderCards();
            renderMarket(cryptoData);
            if (document.getElementById('watchlist')?.classList.contains('active')) renderWatchlist();
            if (document.getElementById('converter')?.classList.contains('active')) initConverter();
            if (document.getElementById('trading')?.classList.contains('active')) renderTradingCoinList();
        }
        renderAlerts();
        renderTxHistory();
    };

    // =====================================================
    // PORTFOLIO CHART
    // =====================================================
    function getCurrentPortfolioValue() {
        let coinValue = 0;
        for (let coinId in wallet.assets) {
            const coin = cryptoData.find(c => c.id === coinId);
            if (coin && wallet.assets[coinId] > 0) coinValue += wallet.assets[coinId] * coin.current_price;
        }
        return wallet.cash + coinValue;
    }

    function recordPortfolioSnapshot() {
        portfolioHistory.push({ time: Date.now(), value: getCurrentPortfolioValue() });
        if (portfolioHistory.length > 500) portfolioHistory = portfolioHistory.slice(-500);
        localStorage.setItem('nexusPortfolioHistory', JSON.stringify(portfolioHistory));
    }

    function getChartDataForPeriod(period) {
        const now = Date.now();
        const ms = { '1m': 30 * 86400000, '3m': 90 * 86400000, '6m': 180 * 86400000, '1y': 365 * 86400000 };
        const since = now - (ms[period] || ms['1m']);
        let filtered = portfolioHistory.filter(p => p.time >= since);
        if (filtered.length === 0) filtered = portfolioHistory.slice(-20);
        if (filtered.length === 0) {
            return { labels: [new Date().toLocaleDateString('az-AZ', { month: 'short', day: 'numeric' })], data: [0] };
        }
        const maxPoints = 30;
        let sampled = filtered;
        if (filtered.length > maxPoints) {
            const step = Math.ceil(filtered.length / maxPoints);
            sampled = filtered.filter((_, i) => i % step === 0);
            if (sampled[sampled.length - 1] !== filtered[filtered.length - 1]) sampled.push(filtered[filtered.length - 1]);
        }
        return {
            labels: sampled.map(p => new Date(p.time).toLocaleDateString('az-AZ', { month: 'short', day: 'numeric' })),
            data: sampled.map(p => p.value)
        };
    }

    function initPortfolioChart(period = '1m') {
        const ctx = document.getElementById('portfolioChart');
        if (!ctx) return;
        if (myPortfolioChart) myPortfolioChart.destroy();
        const d = getChartDataForPeriod(period);
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3d6eff';
        myPortfolioChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: d.labels,
                datasets: [{
                    label: 'Balans ($)',
                    data: d.data,
                    borderColor: accent,
                    backgroundColor: accent + '18',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.4,
                    pointRadius: d.data.length > 15 ? 0 : 3,
                    pointBackgroundColor: accent
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#808a9d', maxTicksLimit: 8 } },
                    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#808a9d', callback: v => '$' + (v >= 1000 ? (v/1000).toFixed(0)+'k' : v.toFixed(0)) } }
                }
            }
        });
    }

    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            initPortfolioChart(this.dataset.period);
        });
    });

    // =====================================================
    // USER UI
    // =====================================================
    function updateUI() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            ['user-name-display', 'user-name-side'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerText = user.name;
            });
            ['user-avatar-head', 'user-avatar-side'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.src = user.avatar || '';
            });
            document.getElementById('header-auth-btn')?.style.setProperty('display', 'none');
            document.getElementById('header-profile')?.style.setProperty('display', 'flex');
            document.getElementById('sidebar-profile')?.style.setProperty('display', 'flex');
            // Hide login link when logged in
            const authLink = document.getElementById('auth-nav-link');
            if (authLink) {
                authLink.style.display = 'none';
            }
        }
    }

    // =====================================================
    // WALLET & BALANS
    // =====================================================
    // ── ADD BALANCE MODAL ───────────────────────────────────
    window.addCash = function() {
        const modal = document.getElementById('add-cash-modal');
        if (!modal) return;
        const input = document.getElementById('add-cash-input');
        const cur = document.getElementById('add-cash-current');
        if (input) input.value = '';
        if (cur) cur.textContent = 'Cari: $' + wallet.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        modal.style.display = 'flex';
        setTimeout(() => input?.focus(), 150);
    };

    window.closeAddCashModal = function() {
        const modal = document.getElementById('add-cash-modal');
        if (modal) modal.style.display = 'none';
    };

    window.setAddAmount = function(amount, btn) {
        const input = document.getElementById('add-cash-input');
        if (input) { input.value = amount; input.focus(); }
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
    };

    window.confirmAddCash = function() {
        const input = document.getElementById('add-cash-input');
        const amount = parseFloat(input?.value);
        if (isNaN(amount) || amount <= 0) {
            showToast(window.t('invalid_amount'), 'danger');
            input?.focus();
            return;
        }
        wallet.cash += amount;
        saveAndRefresh();
        closeAddCashModal();
        showToast(`✅ +$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} əlavə edildi!`, 'success');
    };

    window.resetWallet = function() {
        if (confirm(window.t('reset_confirm'))) {
            wallet = { cash: 0, assets: {}, costBasis: {} };
            portfolioHistory = [];
            localStorage.setItem('nexusPortfolioHistory', JSON.stringify(portfolioHistory));
            txHistory = [];
            localStorage.setItem('nexusTxHistory', JSON.stringify(txHistory));
            saveAndRefresh();
            location.reload();
        }
    };

    function saveAndRefresh() {
        localStorage.setItem('nexusWallet', JSON.stringify(wallet));
        recordPortfolioSnapshot();
        updateWalletDisplay(cryptoData);
        renderCards();
        if (document.getElementById('dash')?.classList.contains('active')) initPortfolioChart(document.querySelector('.period-btn.active')?.dataset.period || '1m');
    }

    function updateWalletDisplay(livePrices = null) {
        const walletCash = document.getElementById('wallet-cash-balance');
        const walletWealth = document.getElementById('wallet-total-wealth');
        const dashBal = document.getElementById('dash-total-balance');
        const formattedCash = `$${wallet.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (walletCash) walletCash.innerText = formattedCash;

        if (livePrices && livePrices.length > 0) {
            let totalInCoins = 0;
            let totalCost = 0;
            let bestTrade = null;
            let bestGain = -Infinity;

            for (let coinId in wallet.assets) {
                const coin = livePrices.find(c => c.id === coinId);
                if (coin && wallet.assets[coinId] > 0) {
                    const val = wallet.assets[coinId] * coin.current_price;
                    const cost = (wallet.costBasis?.[coinId] || 0);
                    totalInCoins += val;
                    totalCost += cost;
                    const gain = val - cost;
                    if (gain > bestGain) { bestGain = gain; bestTrade = coin.symbol.toUpperCase(); }
                }
            }

            if (walletWealth) walletWealth.innerText = `$${totalInCoins.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            if (dashBal) dashBal.innerText = `$${(totalInCoins + wallet.cash).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            const pnl = totalInCoins - totalCost;
            const pnlPct = totalCost > 0 ? ((pnl / totalCost) * 100) : 0;
            const pnlEl = document.getElementById('pnl-total');
            const pnlPctEl = document.getElementById('pnl-pct');
            if (pnlEl) { pnlEl.innerText = (pnl >= 0 ? '+' : '') + `$${pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; pnlEl.style.color = pnl >= 0 ? 'var(--success)' : 'var(--danger)'; }
            if (pnlPctEl) { pnlPctEl.innerText = (pnlPct >= 0 ? '+' : '') + pnlPct.toFixed(2) + '%'; pnlPctEl.style.color = pnlPct >= 0 ? 'var(--success)' : 'var(--danger)'; }
            document.getElementById('best-trade') && (document.getElementById('best-trade').innerText = bestTrade || '--');
            document.getElementById('trade-count') && (document.getElementById('trade-count').innerText = txHistory.length);
            renderWalletAssetsList(livePrices);
            renderTxHistory();
        }
        applyPrivacySettings();
    }

    // =====================================================
    // COIN CARDS
    // =====================================================
    window.moveCards = function(direction) {
        if (direction === 'next') {
            currentIndex = (currentIndex + 3 >= cryptoData.length) ? 0 : currentIndex + 3;
        } else {
            currentIndex = (currentIndex - 3 < 0) ? Math.floor((cryptoData.length - 1) / 3) * 3 : currentIndex - 3;
        }
        renderCards();
    };

    function renderCards() {
        const activeGrid = document.getElementById('card-grid');
        if (!activeGrid || cryptoData.length === 0) return;
        const selected = cryptoData.slice(currentIndex, currentIndex + 3);
        activeGrid.innerHTML = selected.map(coin => {
            const myAmount = (wallet.assets[coin.id] || 0).toFixed(4);
            const chg = coin.price_change_percentage_24h;
            const isWatchlisted = watchlist.includes(coin.id);
            return `
            <div class="coin-card">
                <div class="card-header">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <img src="${coin.image}" width="40" style="border-radius:50%;">
                        <div>
                            <h4 style="margin:0;color:white;font-size:16px;">${coin.name}</h4>
                            <small style="color:#848e9c;">${coin.symbol.toUpperCase()}</small>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="color:${chg>=0?'#0ecb81':'#f6465d'};background:rgba(255,255,255,0.05);padding:4px 8px;border-radius:6px;font-size:12px;font-weight:700;">
                            ${chg>=0?'▲':'▼'} ${Math.abs(chg).toFixed(2)}%
                        </span>
                        <button onclick="toggleWatchlist('${coin.id}')" style="background:none;border:none;cursor:pointer;font-size:14px;color:${isWatchlisted?'#f0c040':'#555'};" title="${isWatchlisted ? window.t('remove_watchlist_title') : window.t('add_watchlist_title')}">
                            <i class="fa-${isWatchlisted?'solid':'regular'} fa-star"></i>
                        </button>
                    </div>
                </div>
                <div class="price-display" style="font-size:28px;font-weight:900;color:white;margin:18px 0 5px;">$${coin.current_price.toLocaleString()}</div>
                <div style="font-size:12px;color:#848e9c;margin-bottom:18px;">
                    ${window.t('market_cap_label')}: $${(coin.market_cap/1e9).toFixed(2)}B &nbsp;|&nbsp; ${window.t('volume_label')}: $${(coin.total_volume/1e9).toFixed(2)}B
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <button onclick="buyCoin('${coin.id}', ${coin.current_price})" class="buy-btn-nexus">
                        <i class="fa-solid fa-arrow-trend-up"></i> ${window.t('buy_btn')}
                    </button>
                    <button onclick="sellCoin('${coin.id}', ${coin.current_price})" class="sell-btn-nexus">
                        <i class="fa-solid fa-arrow-trend-down"></i> ${window.t('sell_btn')}
                    </button>
                </div>
                <div style="margin-top:12px;border-top:1px solid #1e222d;padding-top:10px;font-size:13px;color:#848e9c;">
                    ${window.t('balance_label')}: <span style="color:white;font-weight:600;">${myAmount} ${coin.symbol.toUpperCase()}</span>
                </div>
            </div>`;
        }).join('');
    }

    // =====================================================
    // TRADE MODAL
    // =====================================================
    function injectTradeModal() {
        if (document.getElementById('nexus-trade-modal')) return;
        const modalHTML = `
        <div id="nexus-trade-modal" style="
            display:none;position:fixed;inset:0;z-index:10000;
            background:rgba(5,6,8,0.88);backdrop-filter:blur(10px);
            align-items:center;justify-content:center;padding:16px;
        ">
            <div style="
                background:#14171c;border:1px solid #232830;border-radius:24px;
                padding:32px 28px;width:100%;max-width:420px;
                box-shadow:0 30px 80px rgba(0,0,0,0.7);
                animation:tradeModalIn 0.3s cubic-bezier(.34,1.56,.64,1);
                position:relative;
            ">
                <button onclick="closeTradeModal()" style="
                    position:absolute;top:16px;right:16px;
                    background:rgba(255,255,255,0.06);border:none;
                    width:34px;height:34px;border-radius:50%;
                    color:#808a9d;cursor:pointer;font-size:14px;
                    transition:0.2s;
                " onmouseover="this.style.color='white';this.style.background='rgba(255,255,255,0.12)'"
                   onmouseout="this.style.color='#808a9d';this.style.background='rgba(255,255,255,0.06)'">✕</button>

                <div style="display:flex;align-items:center;gap:14px;margin-bottom:22px;">
                    <img id="tm-coin-img" src="" width="50" style="border-radius:50%;border:2px solid #232830;flex-shrink:0;">
                    <div>
                        <div id="tm-coin-name" style="font-size:18px;font-weight:800;color:white;line-height:1.2;"></div>
                        <div id="tm-coin-sym" style="font-size:13px;color:#808a9d;margin-top:2px;"></div>
                    </div>
                    <div style="margin-left:auto;text-align:right;">
                        <div id="tm-label-price" style="font-size:11px;color:#808a9d;margin-bottom:2px;"></div>
                        <div id="tm-coin-price" style="font-size:20px;font-weight:800;color:white;"></div>
                    </div>
                </div>

                <div id="tm-type-badge" style="
                    display:inline-flex;align-items:center;gap:8px;
                    padding:7px 18px;border-radius:20px;font-size:13px;font-weight:700;
                    margin-bottom:20px;
                "></div>

                <div style="background:#0c0e12;border:1px solid #1e2330;border-radius:14px;padding:14px 16px;margin-bottom:16px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span id="tm-label-cash" style="color:#808a9d;font-size:13px;"></span>
                        <span id="tm-cash-bal" style="color:white;font-size:13px;font-weight:700;"></span>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span id="tm-label-holding" style="color:#808a9d;font-size:13px;"></span>
                        <span id="tm-holding" style="color:white;font-size:13px;font-weight:700;"></span>
                    </div>
                </div>

                <div style="margin-bottom:10px;">
                    <label id="tm-label-qty" style="font-size:13px;color:#808a9d;display:block;margin-bottom:8px;font-weight:600;"></label>
                    <input id="tm-amount-input" type="number" min="0" step="any"
                        placeholder="0.00000000"
                        style="
                            width:100%;box-sizing:border-box;
                            padding:14px 16px;background:#0c0e12;
                            border:1.5px solid #232830;border-radius:12px;
                            color:white;font-size:20px;font-weight:700;
                            outline:none;transition:0.25s;
                        "
                        onfocus="this.style.borderColor='#3d6eff';this.style.boxShadow='0 0 0 3px rgba(61,110,255,0.15)'"
                        onblur="this.style.borderColor='#232830';this.style.boxShadow='none'"
                        oninput="updateTradeCalc()"
                    >
                </div>

                <div style="display:flex;gap:8px;margin-bottom:18px;">
                    <button onclick="setTradePercent(0.25)" class="tm-pct-btn">25%</button>
                    <button onclick="setTradePercent(0.5)" class="tm-pct-btn">50%</button>
                    <button onclick="setTradePercent(0.75)" class="tm-pct-btn">75%</button>
                    <button onclick="setTradePercent(1)" class="tm-pct-btn">MAX</button>
                </div>

                <div style="background:#0c0e12;border:1px solid #1e2330;border-radius:12px;padding:14px 16px;margin-bottom:18px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span id="tm-label-total" style="color:#808a9d;font-size:13px;"></span>
                        <span id="tm-total-val" style="color:white;font-size:18px;font-weight:800;">$0.00</span>
                    </div>
                </div>

                <button id="tm-confirm-btn" onclick="confirmTrade()" style="
                    width:100%;padding:16px;border:none;border-radius:14px;
                    font-size:16px;font-weight:800;cursor:pointer;
                    transition:0.25s;letter-spacing:0.3px;
                "></button>
                <div id="tm-error-msg" style="color:#ff3e3e;font-size:13px;text-align:center;margin-top:10px;min-height:18px;"></div>
            </div>
        </div>
        <style>
            @keyframes tradeModalIn {
                from { opacity:0; transform:scale(0.88) translateY(24px); }
                to   { opacity:1; transform:scale(1) translateY(0); }
            }
            .tm-pct-btn {
                flex:1;padding:9px 4px;background:rgba(61,110,255,0.1);
                border:1px solid rgba(61,110,255,0.22);border-radius:8px;
                color:#3d6eff;font-size:12px;font-weight:700;cursor:pointer;
                transition:0.2s;
            }
            .tm-pct-btn:hover { background:rgba(61,110,255,0.25);border-color:rgba(61,110,255,0.5); }
        </style>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('nexus-trade-modal').addEventListener('click', function(e) {
            if (e.target === this) closeTradeModal();
        });
    }

    let _tradeState = { type: '', coinId: '', price: 0, coin: null };

    window.closeTradeModal = function() {
        const m = document.getElementById('nexus-trade-modal');
        if (m) m.style.display = 'none';
    };

    window.updateTradeCalc = function() {
        const amt = parseFloat(document.getElementById('tm-amount-input')?.value) || 0;
        const total = amt * _tradeState.price;
        const totalEl = document.getElementById('tm-total-val');
        if (totalEl) totalEl.innerText = '$' + total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('tm-error-msg').innerText = '';
    };

    window.setTradePercent = function(pct) {
        const input = document.getElementById('tm-amount-input');
        if (!input) return;
        let maxAmt = _tradeState.type === 'buy'
            ? wallet.cash / _tradeState.price
            : (wallet.assets[_tradeState.coinId] || 0);
        input.value = (maxAmt * pct).toFixed(8);
        updateTradeCalc();
    };

    window.confirmTrade = function() {
        const { type, coinId, price } = _tradeState;
        const amount = parseFloat(document.getElementById('tm-amount-input')?.value);
        const errEl = document.getElementById('tm-error-msg');
        errEl.innerText = '';

        if (isNaN(amount) || amount <= 0) { errEl.innerText = window.t('invalid_amount'); return; }

        if (type === 'buy') {
            const cost = amount * price;
            if (wallet.cash < cost) { errEl.innerText = `${window.t('insufficient_balance')} $${cost.toFixed(2)}`; return; }
            wallet.cash -= cost;
            wallet.assets[coinId] = (wallet.assets[coinId] || 0) + amount;
            wallet.costBasis = wallet.costBasis || {};
            wallet.costBasis[coinId] = (wallet.costBasis[coinId] || 0) + cost;
            txHistory.unshift({ type: 'buy', coinId, amount, price, cost, time: Date.now() });
            if (txHistory.length > 50) txHistory.pop();
            localStorage.setItem('nexusTxHistory', JSON.stringify(txHistory));
            saveAndRefresh();
            closeTradeModal();
            showToast(`✅ ${amount.toFixed(4)} ${coinId.toUpperCase()} ${window.t('buy_success')}`, 'success');
        } else {
            const holding = wallet.assets[coinId] || 0;
            if (amount > holding) { errEl.innerText = `${window.t('insufficient_coins')} ${holding.toFixed(4)}`; return; }
            const revenue = amount * price;
            wallet.cash += revenue;
            wallet.assets[coinId] -= amount;
            if (wallet.assets[coinId] < 0.00001) wallet.assets[coinId] = 0;
            txHistory.unshift({ type: 'sell', coinId, amount, price, revenue, time: Date.now() });
            if (txHistory.length > 50) txHistory.pop();
            localStorage.setItem('nexusTxHistory', JSON.stringify(txHistory));
            saveAndRefresh();
            closeTradeModal();
            showToast(`✅ ${amount.toFixed(4)} ${coinId.toUpperCase()} ${window.t('sell_success')} +$${revenue.toFixed(2)}`, 'success');
        }
    };

    function openTradeModal(type, coinId, price) {
        injectTradeModal();
        const coin = cryptoData.find(c => c.id === coinId);
        _tradeState = { type, coinId, price, coin };

        document.getElementById('tm-coin-img').src = coin?.image || '';
        document.getElementById('tm-coin-name').innerText = coin?.name || coinId;
        document.getElementById('tm-coin-sym').innerText = (coin?.symbol || coinId).toUpperCase();
        document.getElementById('tm-coin-price').innerText = '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('tm-amount-input').value = '';
        document.getElementById('tm-total-val').innerText = '$0.00';
        document.getElementById('tm-error-msg').innerText = '';

        // Translated labels
        document.getElementById('tm-label-price').innerText = window.t('current_price_label');
        document.getElementById('tm-label-cash').innerHTML = '💵 ' + window.t('cash_bal_modal');
        document.getElementById('tm-label-holding').innerHTML = '🪙 ' + window.t('available_coin');
        document.getElementById('tm-label-qty').innerHTML = window.t('quantity_label') + ' &nbsp;<span id="tm-sym-label" style="color:#3d6eff;"></span>';
        document.getElementById('tm-label-total').innerText = window.t('total_value_label');
        document.getElementById('tm-confirm-btn').innerText = window.t('confirm_btn');

        document.getElementById('tm-cash-bal').innerText = '$' + wallet.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const holding = wallet.assets[coinId] || 0;
        document.getElementById('tm-holding').innerText = holding.toFixed(6) + ' ' + (coin?.symbol || coinId).toUpperCase();
        document.getElementById('tm-sym-label').innerText = (coin?.symbol || coinId).toUpperCase();

        const badge = document.getElementById('tm-type-badge');
        const btn = document.getElementById('tm-confirm-btn');
        if (type === 'buy') {
            badge.innerHTML = window.t('buy_order');
            badge.style.cssText = 'display:inline-flex;align-items:center;gap:8px;padding:7px 18px;border-radius:20px;font-size:13px;font-weight:700;margin-bottom:20px;background:rgba(14,203,129,0.12);color:#0ecb81;border:1px solid rgba(14,203,129,0.25);';
            btn.style.cssText = 'width:100%;padding:16px;border:none;border-radius:14px;font-size:16px;font-weight:800;cursor:pointer;transition:0.25s;letter-spacing:0.3px;background:linear-gradient(135deg,#0ecb81,#00a86b);color:white;';
        } else {
            badge.innerHTML = window.t('sell_order');
            badge.style.cssText = 'display:inline-flex;align-items:center;gap:8px;padding:7px 18px;border-radius:20px;font-size:13px;font-weight:700;margin-bottom:20px;background:rgba(246,70,93,0.12);color:#f6465d;border:1px solid rgba(246,70,93,0.25);';
            btn.style.cssText = 'width:100%;padding:16px;border:none;border-radius:14px;font-size:16px;font-weight:800;cursor:pointer;transition:0.25s;letter-spacing:0.3px;background:linear-gradient(135deg,#f6465d,#c0392b);color:white;';
        }

        document.getElementById('nexus-trade-modal').style.display = 'flex';
        setTimeout(() => document.getElementById('tm-amount-input')?.focus(), 150);
    }

    window.buyCoin = function(coinId, price) {
        openTradeModal('buy', coinId, price);
    };

    window.sellCoin = function(coinId, price) {
        const holding = wallet.assets[coinId] || 0;
        if (holding <= 0) { showToast(window.t('no_coin_owned'), 'danger'); return; }
        openTradeModal('sell', coinId, price);
    };

    // =====================================================
    // WALLET ASSETS LIST
    // =====================================================
    function renderWalletAssetsList(livePrices) {
        const listContainer = document.getElementById('wallet-assets-list');
        if (!listContainer) return;
        let html = '';
        const assetKeys = Object.keys(wallet.assets).filter(k => wallet.assets[k] > 0.00001);
        assetKeys.forEach(coinId => {
            const amount = wallet.assets[coinId];
            const coin = livePrices.find(c => c.id === coinId);
            if (coin) {
                const totalValue = amount * coin.current_price;
                const costBasis = wallet.costBasis?.[coinId] || 0;
                const pnl = totalValue - costBasis;
                const pnlPct = costBasis > 0 ? ((pnl / costBasis) * 100).toFixed(2) : '0.00';
                html += `
                <div class="asset-row">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <img src="${coin.image}" width="36" style="border-radius:50%;">
                        <div><h4 style="margin:0;color:white;">${coin.name}</h4><small style="color:#848e9c;">${coin.symbol.toUpperCase()}</small></div>
                    </div>
                    <div style="text-align:center;"><small style="color:#848e9c;display:block;">${window.t('qty_col')}</small><span style="color:white;font-weight:700;">${amount.toFixed(4)}</span></div>
                    <div style="text-align:center;"><small style="color:#848e9c;display:block;">${window.t('avg_price_col')}</small><span style="color:white;font-weight:700;">$${costBasis>0?(costBasis/amount).toFixed(2):'--'}</span></div>
                    <div style="text-align:center;"><small style="color:#848e9c;display:block;">P&L</small><span style="color:${pnl>=0?'var(--success)':'var(--danger)'};font-weight:700;">${pnl>=0?'+':''}$${pnl.toFixed(2)} (${pnlPct}%)</span></div>
                    <div style="text-align:right;"><small style="color:#848e9c;display:block;">${window.t('value_col')}</small><span style="color:var(--accent);font-weight:700;">$${totalValue.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
                    <button onclick="sellCoin('${coin.id}', ${coin.current_price})" class="sell-btn-nexus" style="padding:8px 14px;font-size:12px;">${window.t('sell_btn')}</button>
                </div>`;
            }
        });
        listContainer.innerHTML = html || `<p style="text-align:center;padding:40px;color:#848e9c;"><i class="fa-solid fa-inbox" style="font-size:32px;display:block;margin-bottom:10px;"></i>${window.t('empty_portfolio')}</p>`;
    }

    // =====================================================
    // TX HISTORY
    // =====================================================
    function renderTxHistory() {
        const el = document.getElementById('tx-history');
        if (!el) return;
        if (txHistory.length === 0) {
            el.innerHTML = `<p style="color:var(--text-gray);text-align:center;padding:20px;">${window.t('no_transactions')}</p>`;
            return;
        }
        const lang = window.getCurrentLang ? window.getCurrentLang() : 'az';
        const locale = lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'az-AZ';
        el.innerHTML = txHistory.slice(0, 15).map(tx => {
            const d = new Date(tx.time);
            const timeStr = d.toLocaleDateString(locale) + ' ' + d.toLocaleTimeString(locale, {hour:'2-digit',minute:'2-digit'});
            const isBuy = tx.type === 'buy';
            return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid var(--border);">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${isBuy?'rgba(0,255,149,0.1)':'rgba(255,62,62,0.1)'};color:${isBuy?'var(--success)':'var(--danger)'};">
                        <i class="fa-solid fa-${isBuy?'arrow-trend-up':'arrow-trend-down'}"></i>
                    </div>
                    <div>
                        <span style="color:white;font-weight:600;">${isBuy ? window.t('buy_tx') : window.t('sell_tx')} · ${tx.coinId.toUpperCase()}</span><br>
                        <small style="color:var(--text-gray);">${timeStr}</small>
                    </div>
                </div>
                <div style="text-align:right;">
                    <span style="color:white;font-weight:600;">${tx.amount.toFixed(4)} @ $${tx.price.toLocaleString()}</span><br>
                    <small style="color:${isBuy?'var(--danger)':'var(--success)'};">${isBuy?'-':'+'} $${(isBuy?tx.cost:tx.revenue).toFixed(2)}</small>
                </div>
            </div>`;
        }).join('');
    }

    // =====================================================
    // MARKET TABLE
    // =====================================================
    let currentTag = 'all';
    const tagMap = {
        defi: ['uniswap','chainlink','aave','compound','maker','curve-dao-token','synthetix'],
        nft: ['axie-infinity','the-sandbox','decentraland','enjincoin','flow'],
        layer1: ['bitcoin','ethereum','solana','cardano','avalanche-2','polkadot','cosmos'],
        stablecoin: ['tether','usd-coin','binance-usd','dai','true-usd']
    };

    function renderMarket(data) {
        const list = document.getElementById('market-analysis-list');
        if (!list) return;
        list.innerHTML = data.map((coin, i) => {
            const chg = coin.price_change_percentage_24h;
            return `
            <div class="market-table-row">
                <div class="col-rank" style="color:var(--text-gray);">${i + 1}</div>
                <div class="col-name">
                    <div class="coin-info">
                        <img src="${coin.image}" width="32" height="32" style="border-radius:50%;">
                        <div>
                            <span style="color:white;font-weight:600;">${coin.name}</span>
                            <div class="symbol">${coin.symbol.toUpperCase()}</div>
                        </div>
                    </div>
                </div>
                <div class="col-price" style="font-weight:700;color:white;">$${coin.current_price.toLocaleString()}</div>
                <div class="col-change">
                    <span class="${chg >= 0 ? 'price-up' : 'price-down'}" style="padding:4px 10px;border-radius:6px;background:${chg>=0?'rgba(14,203,129,0.1)':'rgba(246,70,93,0.1)'};">
                        ${chg >= 0 ? '▲' : '▼'} ${Math.abs(chg).toFixed(2)}%
                    </span>
                </div>
                <div class="col-marketcap" style="color:var(--text-gray);">$${(coin.market_cap / 1e9).toFixed(2)}B</div>
                <div class="col-action" style="text-align:right;display:flex;gap:8px;justify-content:flex-end;">
                    <button class="trade-btn" onclick="buyCoin('${coin.id}', ${coin.current_price})">${window.t('buy_btn')}</button>
                    <button onclick="toggleWatchlist('${coin.id}')" style="background:none;border:1px solid var(--border);color:${watchlist.includes(coin.id)?'#f0c040':'var(--text-gray)'};padding:7px 10px;border-radius:8px;cursor:pointer;font-size:12px;">
                        <i class="fa-${watchlist.includes(coin.id)?'solid':'regular'} fa-star"></i>
                    </button>
                </div>
            </div>`;
        }).join('');

        const total = data.reduce((s, c) => s + c.market_cap, 0);
        const vol = data.reduce((s, c) => s + c.total_volume, 0);
        const btc = data.find(c => c.id === 'bitcoin');
        const btcDom = btc ? ((btc.market_cap / total) * 100).toFixed(1) : '--';
        document.getElementById('global-cap') && (document.getElementById('global-cap').innerText = '$' + (total / 1e12).toFixed(2) + 'T');
        document.getElementById('global-volume') && (document.getElementById('global-volume').innerText = '$' + (vol / 1e9).toFixed(0) + 'B');
        document.getElementById('btc-dom') && (document.getElementById('btc-dom').innerText = btcDom + '%');
        document.getElementById('active-coins') && (document.getElementById('active-coins').innerText = '10,000+');
    }

    window.filterMarket = function() {
        const q = document.getElementById('market-search')?.value.toLowerCase() || '';
        let filtered = cryptoData;
        if (currentTag !== 'all' && tagMap[currentTag]) filtered = filtered.filter(c => tagMap[currentTag].includes(c.id));
        if (q) filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
        renderMarket(filtered);
    };

    window.filterByTag = function(tag, evt) {
        currentTag = tag;
        document.querySelectorAll('.filter-tabs .filter-btn').forEach(b => b.classList.remove('active'));
        if (evt) evt.target.classList.add('active');
        filterMarket();
    };

    // =====================================================
    // WATCHLIST
    // =====================================================
    window.toggleWatchlist = function(coinId) {
        if (watchlist.includes(coinId)) {
            watchlist = watchlist.filter(id => id !== coinId);
            showToast(window.t('removed_watchlist'), 'info');
        } else {
            watchlist.push(coinId);
            showToast(window.t('added_watchlist'), 'success');
        }
        localStorage.setItem('nexusWatchlist', JSON.stringify(watchlist));
        renderCards();
        if (document.getElementById('watchlist').classList.contains('active')) renderWatchlist();
    };

    function renderWatchlist() {
        const grid = document.getElementById('watchlist-grid');
        if (!grid || cryptoData.length === 0) return;
        const coins = watchlist.map(id => cryptoData.find(c => c.id === id)).filter(Boolean);
        if (coins.length === 0) {
            grid.innerHTML = `<div style="text-align:center;padding:60px;color:var(--text-gray);"><i class="fa-regular fa-star" style="font-size:40px;display:block;margin-bottom:15px;"></i><p>${window.t('watchlist_empty')}<br>${window.t('watchlist_empty_desc')}</p></div>`;
            return;
        }
        grid.innerHTML = coins.map(coin => {
            const chg = coin.price_change_percentage_24h;
            return `
            <div class="watchlist-coin-card card">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:15px;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <img src="${coin.image}" width="38" style="border-radius:50%;">
                        <div>
                            <h4 style="margin:0;color:white;">${coin.name}</h4>
                            <small style="color:var(--text-gray);">${coin.symbol.toUpperCase()}</small>
                        </div>
                    </div>
                    <button onclick="toggleWatchlist('${coin.id}')" style="background:none;border:none;cursor:pointer;color:#f0c040;font-size:16px;"><i class="fa-solid fa-star"></i></button>
                </div>
                <div style="font-size:26px;font-weight:900;color:white;margin-bottom:8px;">$${coin.current_price.toLocaleString()}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:${chg>=0?'var(--success)':'var(--danger)'};font-weight:700;font-size:14px;">
                        ${chg>=0?'▲':'▼'} ${Math.abs(chg).toFixed(2)}%
                    </span>
                    <span style="color:var(--text-gray);font-size:12px;">${window.t('market_cap_label')}: $${(coin.market_cap/1e9).toFixed(1)}B</span>
                </div>
                <div style="display:flex;gap:8px;margin-top:15px;">
                    <button onclick="buyCoin('${coin.id}',${coin.current_price})" class="buy-btn-nexus" style="flex:1;padding:10px;">${window.t('buy_btn')}</button>
                    <button onclick="sellCoin('${coin.id}',${coin.current_price})" class="sell-btn-nexus" style="flex:1;padding:10px;">${window.t('sell_btn')}</button>
                </div>
            </div>`;
        }).join('');
    }

    window.watchlistSearchCoin = function() {
        const q = document.getElementById('watchlist-search')?.value.toLowerCase() || '';
        const dd = document.getElementById('watchlist-dropdown');
        if (!dd) return;
        if (q.length < 1) { dd.style.display = 'none'; return; }
        const matches = cryptoData.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)).slice(0, 6);
        dd.innerHTML = matches.map(c => `
            <div class="wl-dd-item" onclick="addToWatchlist('${c.id}')">
                <img src="${c.image}" width="20" style="border-radius:50%;">
                <span>${c.name} <small style="color:var(--text-gray);">${c.symbol.toUpperCase()}</small></span>
            </div>`).join('');
        dd.style.display = matches.length > 0 ? 'block' : 'none';
    };

    window.addToWatchlist = function(coinId) {
        if (!watchlist.includes(coinId)) {
            watchlist.push(coinId);
            localStorage.setItem('nexusWatchlist', JSON.stringify(watchlist));
            showToast(window.t('added_watchlist'), 'success');
            renderWatchlist();
        }
        document.getElementById('watchlist-search').value = '';
        document.getElementById('watchlist-dropdown').style.display = 'none';
    };

    // =====================================================
    // PRICE ALERTS
    // =====================================================
    window.openAlertModal = function() {
        const modal = document.getElementById('alert-modal');
        if (!modal) return;
        const sel = document.getElementById('alert-coin');
        if (sel && cryptoData.length > 0) {
            sel.innerHTML = cryptoData.slice(0, 30).map(c => `<option value="${c.id}">${c.name} (${c.symbol.toUpperCase()})</option>`).join('');
        }
        // Update alert modal condition options with translations
        const condSel = document.getElementById('alert-condition');
        if (condSel) {
            condSel.options[0].text = window.t('above_label');
            condSel.options[1].text = window.t('below_label');
        }
        modal.style.display = 'flex';
    };

    window.closeAlertModal = function() {
        document.getElementById('alert-modal').style.display = 'none';
    };

    window.createAlert = function() {
        const coinId = document.getElementById('alert-coin').value;
        const condition = document.getElementById('alert-condition').value;
        const price = parseFloat(document.getElementById('alert-price').value);
        if (!coinId || isNaN(price) || price <= 0) { showToast(window.t('invalid_input'), 'danger'); return; }
        const coin = cryptoData.find(c => c.id === coinId);
        priceAlerts.push({ id: Date.now(), coinId, coinName: coin?.name || coinId, symbol: coin?.symbol || coinId, condition, price, triggered: false });
        localStorage.setItem('nexusAlerts', JSON.stringify(priceAlerts));
        closeAlertModal();
        renderAlerts();
        updateNotifBadge();
        showToast(window.t('alert_created'), 'success');
    };

    function renderAlerts() {
        const el = document.getElementById('alerts-list');
        if (!el) return;
        if (priceAlerts.length === 0) {
            el.innerHTML = `<p style="color:var(--text-gray);font-size:13px;text-align:center;padding:20px;">${window.t('no_alerts')}</p>`;
            return;
        }
        el.innerHTML = priceAlerts.map(alert => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 15px;background:var(--bg-app);border:1px solid ${alert.triggered?'var(--success)':'var(--border)'};border-radius:12px;margin-bottom:8px;">
                <div>
                    <span style="color:white;font-weight:600;">${alert.coinName}</span>
                    <span style="color:var(--text-gray);font-size:13px;"> · ${alert.condition==='above' ? window.t('above_cond') : window.t('below_cond')} $${alert.price.toLocaleString()}</span>
                    ${alert.triggered ? `<span style="color:var(--success);font-size:11px;margin-left:8px;">✓ ${window.t('alert_triggered')}</span>` : ''}
                </div>
                <button onclick="deleteAlert(${alert.id})" style="background:none;border:none;color:var(--danger);cursor:pointer;"><i class="fa-solid fa-trash-can"></i></button>
            </div>`).join('');
    }

    window.deleteAlert = function(id) {
        priceAlerts = priceAlerts.filter(a => a.id !== id);
        localStorage.setItem('nexusAlerts', JSON.stringify(priceAlerts));
        renderAlerts();
        updateNotifBadge();
    };

    function checkAlerts() {
        if (cryptoData.length === 0) return;
        let changed = false;
        priceAlerts.forEach(alert => {
            if (alert.triggered) return;
            const coin = cryptoData.find(c => c.id === alert.coinId);
            if (!coin) return;
            const triggered = alert.condition === 'above' ? coin.current_price >= alert.price : coin.current_price <= alert.price;
            if (triggered) {
                alert.triggered = true;
                changed = true;
                const condText = alert.condition === 'above' ? window.t('alert_above') : window.t('alert_below');
                showToast(`🔔 ${alert.coinName} $${alert.price.toLocaleString()} ${condText}!`, 'alert');
            }
        });
        if (changed) {
            localStorage.setItem('nexusAlerts', JSON.stringify(priceAlerts));
            renderAlerts();
        }
    }

    // =====================================================
    // NEWS
    // =====================================================
    const newsItems = [
        { title: "Bitcoin $100,000 Həddinə Yaxınlaşır", summary: "BTC son 24 saatda %3.2 artaraq kritik psixoloji həddə yaxınlaşdı.", tag: 'bitcoin', time: '2 saat əvvəl', icon: '₿', color: '#f7931a' },
        { title: "Ethereum 2.0 Yeniləməsi Gözlənilir", summary: "Ethereum şəbəkəsi növbəti həftə mühüm protokol yeniləməsi alacaq.", tag: 'ethereum', time: '4 saat əvvəl', icon: 'Ξ', color: '#627eea' },
        { title: "DeFi Protokollarında Rekord TVL", summary: "Decentralized Finance protokollarında kilitli dəyər $200B-ı keçdi.", tag: 'defi', time: '6 saat əvvəl', icon: '🔒', color: '#3d6eff' },
        { title: "SEC Kripto ETF Qərarını Açıqlayacaq", summary: "ABŞ Qiymətli Kağızlar Komissiyası yeni kripto ETF müraciətinə bu ay cavab verəcək.", tag: 'all', time: '8 saat əvvəl', icon: '⚖️', color: '#808a9d' },
        { title: "Solana Ekosistemi Rekord İstifadəçi Sayına Çatdı", summary: "Solana blokzəncirinin gündəlik aktiv cüzdanları 5 milyonu aşdı.", tag: 'all', time: '10 saat əvvəl', icon: '◎', color: '#9945ff' },
        { title: "Tether USDT Rezervlərini Açıqladı", summary: "Tether şirkəti rüblük hesabatda $100B-dan çox ABŞ dövlət istiqrazı saxladığını bildirdi.", tag: 'stablecoin', time: '12 saat əvvəl', icon: '₮', color: '#26a17b' },
        { title: "NFT Bazarı Canlanma Əlamətləri Göstərir", summary: "OpenSea platformasında həcm 3 aylıq zirvəsinə çatdı.", tag: 'nft', time: '1 gün əvvəl', icon: '🎨', color: '#eb4b98' },
        { title: "Kripto Birjalarında Tənzimləmə Yenilənmələri", summary: "Avropa Birliyi MiCA çərçivəsinin tətbiqinə hazırlıq tamamlanır.", tag: 'all', time: '1 gün əvvəl', icon: '🏛️', color: '#00b4d8' },
    ];

    let currentNewsFilter = 'all';
    window.filterNews = function(tag, evt) {
        currentNewsFilter = tag;
        document.querySelectorAll('.news-filter-tabs .filter-btn').forEach(b => b.classList.remove('active'));
        if (evt) evt.target.classList.add('active');
        loadNews();
    };

    function loadNews() {
        const grid = document.getElementById('news-grid');
        if (!grid) return;
        const items = currentNewsFilter === 'all' ? newsItems : newsItems.filter(n => n.tag === currentNewsFilter || n.tag === 'all');
        grid.innerHTML = items.map(item => `
            <div class="news-card card">
                <div style="display:flex;align-items:flex-start;gap:15px;">
                    <div style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05);font-size:20px;flex-shrink:0;">${item.icon}</div>
                    <div style="flex:1;">
                        <h4 style="margin:0 0 8px;color:white;line-height:1.4;">${item.title}</h4>
                        <p style="color:var(--text-gray);font-size:13px;margin:0 0 12px;line-height:1.6;">${item.summary}</p>
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <span style="font-size:11px;background:rgba(61,110,255,0.1);color:var(--accent);padding:3px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">${item.tag === 'all' ? window.t('news_tag_general') : item.tag}</span>
                            <span style="font-size:12px;color:var(--text-gray);"><i class="fa-regular fa-clock"></i> ${item.time}</span>
                        </div>
                    </div>
                </div>
            </div>`).join('');
    }

    // =====================================================
    // CONVERTER
    // =====================================================
    function initConverter() {
        if (cryptoData.length === 0) return;
        const fromSel = document.getElementById('conv-from');
        const toSel = document.getElementById('conv-to');
        if (!fromSel || !toSel) return;

        const options = [
            '<option value="usd">USD 🇺🇸</option>',
            '<option value="eur">EUR 🇪🇺</option>',
            '<option value="gbp">GBP 🇬🇧</option>',
            ...cryptoData.slice(0, 20).map(c => `<option value="${c.id}">${c.name} (${c.symbol.toUpperCase()})</option>`)
        ].join('');

        fromSel.innerHTML = options;
        toSel.innerHTML = options;
        toSel.value = 'bitcoin';
        doConvert();
        renderPairs();
    }

    const fiatRates = { usd: 1, eur: 0.92, gbp: 0.79 };

    function getUSDPrice(id) {
        if (fiatRates[id] !== undefined) return 1 / fiatRates[id];
        const coin = cryptoData.find(c => c.id === id);
        return coin ? coin.current_price : null;
    }

    window.doConvert = function() {
        const amount = parseFloat(document.getElementById('conv-amount')?.value) || 0;
        const fromId = document.getElementById('conv-from')?.value;
        const toId = document.getElementById('conv-to')?.value;
        const resultEl = document.getElementById('conv-result');
        const rateEl = document.getElementById('conv-rate');
        if (!fromId || !toId || !resultEl) return;

        const fromPrice = getUSDPrice(fromId);
        const toPrice = getUSDPrice(toId);
        if (!fromPrice || !toPrice) { resultEl.value = '--'; return; }

        const result = (amount * fromPrice) / toPrice;
        resultEl.value = result.toLocaleString('en-US', { maximumFractionDigits: 6 });

        const rate1 = toPrice / fromPrice;
        const fromLabel = fromId.toUpperCase() === 'USD' || fromId.toUpperCase() === 'EUR' || fromId.toUpperCase() === 'GBP' ? fromId.toUpperCase() : cryptoData.find(c=>c.id===fromId)?.symbol.toUpperCase() || fromId;
        const toLabel = toId.toUpperCase() === 'USD' || toId.toUpperCase() === 'EUR' || toId.toUpperCase() === 'GBP' ? toId.toUpperCase() : cryptoData.find(c=>c.id===toId)?.symbol.toUpperCase() || toId;
        if (rateEl) rateEl.innerText = `1 ${fromLabel} = ${rate1.toLocaleString('en-US', {maximumFractionDigits:6})} ${toLabel}`;
    };

    window.swapConverter = function() {
        const from = document.getElementById('conv-from');
        const to = document.getElementById('conv-to');
        const tmp = from.value;
        from.value = to.value;
        to.value = tmp;
        doConvert();
    };

    function renderPairs() {
        const el = document.getElementById('pairs-grid');
        if (!el) return;
        const pairs = [
            {from:'bitcoin',to:'usd'}, {from:'ethereum',to:'usd'}, {from:'bitcoin',to:'ethereum'},
            {from:'solana',to:'usd'}, {from:'cardano',to:'usd'}, {from:'ripple',to:'usd'}
        ];
        el.innerHTML = pairs.map(p => {
            const fCoin = cryptoData.find(c=>c.id===p.from);
            const fromPrice = getUSDPrice(p.from);
            const toPrice = getUSDPrice(p.to);
            if (!fCoin || !fromPrice || !toPrice) return '';
            const rate = fromPrice / toPrice;
            return `
            <div class="pair-card card" onclick="document.getElementById('conv-from').value='${p.from}';document.getElementById('conv-to').value='${p.to}';doConvert();" style="cursor:pointer;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                    <img src="${fCoin.image}" width="24" style="border-radius:50%;">
                    <span style="color:white;font-weight:600;font-size:13px;">${p.from.toUpperCase()} / ${p.to.toUpperCase()}</span>
                </div>
                <div style="color:var(--accent);font-weight:700;">${rate.toLocaleString('en-US',{maximumFractionDigits:6})}</div>
            </div>`;
        }).join('');
    }

    // =====================================================
    // TICKER
    // =====================================================
    function renderTicker() {
        const ticker = document.getElementById('ticker-grid');
        if (!ticker) return;
        const html = cryptoData.slice(0, 15).map(coin => {
            const chg = coin.price_change_percentage_24h;
            return `
            <div style="display:flex;align-items:center;gap:10px;padding:0 25px;white-space:nowrap;">
                <img src="${coin.image}" width="16" style="border-radius:50%;">
                <span style="font-weight:700;color:white;">${coin.symbol.toUpperCase()}</span>
                <span style="color:#848e9c;">$${coin.current_price.toLocaleString()}</span>
                <span style="color:${chg>=0?'#0ecb81':'#f6465d'};font-size:12px;">${chg>=0?'▲':'▼'}${Math.abs(chg).toFixed(2)}%</span>
            </div>`;
        }).join('');
        ticker.innerHTML = html + html;
    }

    // =====================================================
    // KPI ROW
    // =====================================================
    function updateKPIs() {
        const btc = cryptoData.find(c => c.id === 'bitcoin');
        const eth = cryptoData.find(c => c.id === 'ethereum');
        const sorted = [...cryptoData].sort((a,b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
        const gainer = sorted[0];
        const loser = sorted[sorted.length - 1];

        if (btc) {
            document.getElementById('kpi-btc-price') && (document.getElementById('kpi-btc-price').innerText = '$' + btc.current_price.toLocaleString());
            document.getElementById('kpi-btc-img') && (document.getElementById('kpi-btc-img').src = btc.image);
            const chg = btc.price_change_percentage_24h;
            const el = document.getElementById('kpi-btc-chg');
            if (el) { el.innerText = (chg>=0?'+':'')+chg.toFixed(2)+'%'; el.className = 'kpi-badge ' + (chg>=0?'up-badge':'down-badge'); }
        }
        if (eth) {
            document.getElementById('kpi-eth-price') && (document.getElementById('kpi-eth-price').innerText = '$' + eth.current_price.toLocaleString());
            document.getElementById('kpi-eth-img') && (document.getElementById('kpi-eth-img').src = eth.image);
            const chg = eth.price_change_percentage_24h;
            const el = document.getElementById('kpi-eth-chg');
            if (el) { el.innerText = (chg>=0?'+':'')+chg.toFixed(2)+'%'; el.className = 'kpi-badge ' + (chg>=0?'up-badge':'down-badge'); }
        }
        if (gainer) {
            document.getElementById('top-gainer-name') && (document.getElementById('top-gainer-name').innerText = gainer.symbol.toUpperCase());
            document.getElementById('top-gainer-pct') && (document.getElementById('top-gainer-pct').innerText = '+'+gainer.price_change_percentage_24h.toFixed(2)+'%');
        }
        if (loser) {
            document.getElementById('top-loser-name') && (document.getElementById('top-loser-name').innerText = loser.symbol.toUpperCase());
            document.getElementById('top-loser-pct') && (document.getElementById('top-loser-pct').innerText = loser.price_change_percentage_24h.toFixed(2)+'%');
        }

    }

    // =====================================================
    // PRIVACY SETTINGS (Hide Balance)
    // =====================================================
    function applyPrivacySettings() {
        const prefs = JSON.parse(localStorage.getItem('nexusPrefs') || '{}');
        if (!prefs.hide_balance) return;
        const balIds = ['wallet-total-wealth', 'wallet-cash-balance', 'dash-total-balance'];
        balIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el || el.textContent === '••••••') return;
            el.setAttribute('data-real', el.textContent);
            el.textContent = '••••••';
            const row = el.closest('.balance-row');
            if (row) {
                const icon = row.querySelector('.eye-toggle-btn i');
                if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
                const btn = row.querySelector('.eye-toggle-btn');
                if (btn) btn.classList.add('hidden');
            }
        });
    }

    // =====================================================
    // NOTIFICATION BADGE
    // =====================================================
    function updateNotifBadge() {
        const badge = document.getElementById('notif-badge');
        if (!badge) return;
        const active = priceAlerts.filter(a => !a.triggered).length;
        if (active > 0) {
            badge.textContent = active > 9 ? '9+' : active;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    // =====================================================
    // TOAST NOTIFICATIONS
    // =====================================================
    function showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position:fixed;bottom:30px;right:30px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
            document.body.appendChild(container);
        }
        const colors = { success: 'var(--success)', danger: 'var(--danger)', info: 'var(--accent)', alert: '#f0c040' };
        const toast = document.createElement('div');
        toast.style.cssText = `background:var(--bg-card);border:1px solid ${colors[type] || colors.info};border-radius:12px;padding:14px 20px;color:white;font-size:14px;min-width:280px;box-shadow:0 10px 30px rgba(0,0,0,0.4);animation:slideInRight 0.3s ease;`;
        toast.innerHTML = message;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
    }

    // =====================================================
    // TRADING TERMINAL
    // =====================================================
    let tradingSelectedCoin = null;
    let tradingOrderType = 'buy';
    let tradingCurrentTF = 'D';
    let tradingListTab = 'all';

    function tvSymbolForCoin(coinId) {
        const map = {
            bitcoin: 'BINANCE:BTCUSDT', ethereum: 'BINANCE:ETHUSDT',
            'binancecoin': 'BINANCE:BNBUSDT', solana: 'BINANCE:SOLUSDT',
            'usd-coin': 'BINANCE:USDCUSDT', ripple: 'BINANCE:XRPUSDT',
            cardano: 'BINANCE:ADAUSDT', dogecoin: 'BINANCE:DOGEUSDT',
            'shiba-inu': 'BINANCE:SHIBUSDT', avalanche: 'BINANCE:AVAXUSDT',
            polkadot: 'BINANCE:DOTUSDT', 'matic-network': 'BINANCE:MATICUSDT',
            chainlink: 'BINANCE:LINKUSDT', uniswap: 'BINANCE:UNIUSDT',
            litecoin: 'BINANCE:LTCUSDT', tron: 'BINANCE:TRXUSDT',
            near: 'BINANCE:NEARUSDT', stellar: 'BINANCE:XLMUSDT',
            aptos: 'BINANCE:APTUSDT', 'the-open-network': 'BINANCE:TONUSDT',
            arbitrum: 'BINANCE:ARBUSDT', cosmos: 'BINANCE:ATOMUSDT',
            algorand: 'BINANCE:ALGOUSDT', 'internet-computer': 'BINANCE:ICPUSDT',
            vechain: 'BINANCE:VETUSDT', filecoin: 'BINANCE:FILUSDT',
            hedera: 'BINANCE:HBARUSDT',
        };
        if (map[coinId]) return map[coinId];
        const coin = cryptoData.find(c => c.id === coinId);
        if (coin) return 'BINANCE:' + coin.symbol.toUpperCase() + 'USDT';
        return 'BINANCE:BTCUSDT';
    }

    function updateTradingHeaderStats() {
        const btc = cryptoData.find(c => c.id === 'bitcoin');
        const eth = cryptoData.find(c => c.id === 'ethereum');
        if (btc) {
            const v = document.getElementById('tstat-btc-val');
            const c = document.getElementById('tstat-btc-chg');
            if (v) v.textContent = '$' + btc.current_price.toLocaleString();
            if (c) { const chg = btc.price_change_percentage_24h; c.textContent = (chg>=0?'+':'')+chg.toFixed(2)+'%'; c.style.color = chg>=0?'#0ecb81':'#f6465d'; }
        }
        if (eth) {
            const v = document.getElementById('tstat-eth-val');
            const c = document.getElementById('tstat-eth-chg');
            if (v) v.textContent = '$' + eth.current_price.toLocaleString();
            if (c) { const chg = eth.price_change_percentage_24h; c.textContent = (chg>=0?'+':'')+chg.toFixed(2)+'%'; c.style.color = chg>=0?'#0ecb81':'#f6465d'; }
        }
        const balEl = document.getElementById('tstat-balance-val');
        if (balEl) {
            const total = wallet.cash + Object.keys(wallet.assets).reduce((s, id) => {
                const c = cryptoData.find(x => x.id === id);
                return s + (c ? (wallet.assets[id] || 0) * c.current_price : 0);
            }, 0);
            balEl.textContent = '$' + total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    }

    window.openTradingTerminal = function() {
        if (cryptoData.length === 0) return;
        updateTradingHeaderStats();
        renderTradingCoinList();
        if (!tradingSelectedCoin) {
            const btc = cryptoData.find(c => c.id === 'bitcoin') || cryptoData[0];
            selectTradingCoin(btc);
        } else {
            updateOrderBalances();
            renderOrderRecentTrades();
        }
    };
    function openTradingTerminal() { window.openTradingTerminal(); }

    window.setTradingListTab = function(tab, btn) {
        tradingListTab = tab;
        document.querySelectorAll('.tl-tab').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        renderTradingCoinList();
    };

    function renderTradingCoinList() {
        const scroll = document.getElementById('trading-coin-scroll');
        if (!scroll || cryptoData.length === 0) return;
        const q = (document.getElementById('trading-search')?.value || '').toLowerCase();
        let list = q ? cryptoData.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)) : [...cryptoData];
        if (tradingListTab === 'watchlist') {
            list = list.filter(c => watchlist.includes(c.id));
        } else if (tradingListTab === 'gainers') {
            list = list.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 20);
        }
        if (list.length === 0) {
            scroll.innerHTML = '<p style="color:var(--text-gray);font-size:12px;text-align:center;padding:20px;">Koin tapılmadı</p>';
            return;
        }
        scroll.innerHTML = list.map(coin => {
            const chg = coin.price_change_percentage_24h;
            const isActive = tradingSelectedCoin && tradingSelectedCoin.id === coin.id;
            const priceStr = coin.current_price < 0.01 ? coin.current_price.toFixed(6) : coin.current_price < 1 ? coin.current_price.toFixed(4) : coin.current_price.toLocaleString();
            const owned = (wallet.assets[coin.id] || 0) > 0;
            return `<div class="trading-coin-item${isActive ? ' active' : ''}" onclick="selectTradingCoin(cryptoData.find(c=>c.id==='${coin.id}'))">
                <div class="tci-img-wrap">
                    <img src="${coin.image}" alt="${coin.symbol}">
                    ${owned ? '<span class="tci-owned-dot"></span>' : ''}
                </div>
                <div class="tci-info">
                    <div class="tci-name">${coin.symbol.toUpperCase()}${coin.market_cap_rank ? `<span class="tci-rank">#${coin.market_cap_rank}</span>` : ''}</div>
                    <div class="tci-sym">${coin.name}</div>
                </div>
                <div class="tci-price">
                    <div class="tci-pval">$${priceStr}</div>
                    <div class="tci-pchg" style="color:${chg>=0?'#0ecb81':'#f6465d'}">${chg>=0?'+':''}${chg.toFixed(2)}%</div>
                </div>
            </div>`;
        }).join('');
    }

    window.selectTradingCoin = function(coin) {
        if (!coin) return;
        tradingSelectedCoin = coin;
        const img = document.getElementById('trading-chart-img');
        const nameEl = document.getElementById('trading-chart-name');
        const symEl = document.getElementById('trading-chart-sym');
        const priceEl = document.getElementById('trading-chart-price');
        const chgEl = document.getElementById('trading-chart-chg');
        if (img) img.src = coin.image;
        if (nameEl) nameEl.textContent = coin.name;
        if (symEl) symEl.textContent = coin.symbol.toUpperCase() + ' / USDT';
        if (priceEl) priceEl.textContent = '$' + coin.current_price.toLocaleString();
        const chg = coin.price_change_percentage_24h;
        if (chgEl) { chgEl.textContent = (chg>=0?'+':'')+chg.toFixed(2)+'%'; chgEl.style.color = chg>=0?'#0ecb81':'#f6465d'; }
        // OHLC stats
        const hi = document.getElementById('ohlc-high');
        const lo = document.getElementById('ohlc-low');
        const vol = document.getElementById('ohlc-vol');
        const mcap = document.getElementById('ohlc-mcap');
        if (hi) hi.textContent = coin.high_24h ? '$'+coin.high_24h.toLocaleString() : '--';
        if (lo) lo.textContent = coin.low_24h ? '$'+coin.low_24h.toLocaleString() : '--';
        if (vol) vol.textContent = coin.total_volume ? '$'+((coin.total_volume)/1e9).toFixed(2)+'B' : '--';
        if (mcap) mcap.textContent = coin.market_cap ? '$'+((coin.market_cap)/1e9).toFixed(1)+'B' : '--';
        updateOrderBalances();
        updateOrderTotal();
        updatePositionCard(coin);
        renderOrderRecentTrades();
        loadTradingViewChart(tvSymbolForCoin(coin.id), tradingCurrentTF);
        renderTradingCoinList();
    };

    function updatePositionCard(coin) {
        const panel = document.getElementById('order-position-card');
        if (!panel) return;
        const held = wallet.assets[coin.id] || 0;
        if (held <= 0) { panel.style.display = 'none'; return; }
        const currentVal = held * coin.current_price;
        const costBasis = wallet.costBasis?.[coin.id] || 0;
        const pnl = currentVal - costBasis;
        const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
        const avgPrice = costBasis > 0 ? costBasis / held : 0;
        panel.style.display = 'block';
        panel.innerHTML = `
            <div class="pos-card-title"><i class="fa-solid fa-briefcase"></i> Açıq Mövqe</div>
            <div class="pos-grid">
                <div class="pos-item"><span>Miqdar</span><strong>${held.toFixed(6)} ${coin.symbol.toUpperCase()}</strong></div>
                <div class="pos-item"><span>Orta Qiymət</span><strong>$${avgPrice > 0 ? avgPrice.toLocaleString('en-US',{maximumFractionDigits:4}) : '--'}</strong></div>
                <div class="pos-item"><span>Cari Dəyər</span><strong>$${currentVal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></div>
                <div class="pos-item"><span>Gəlir / Zərər</span><strong style="color:${pnl>=0?'#0ecb81':'#f6465d'}">${pnl>=0?'+':''}$${Math.abs(pnl).toFixed(2)} (${pnlPct>=0?'+':''}${pnlPct.toFixed(2)}%)</strong></div>
            </div>`;
    }

    function loadTradingViewChart(symbol, interval) {
        const container = document.getElementById('trading-tv-container');
        if (!container) return;
        container.innerHTML = '';
        if (typeof TradingView === 'undefined') {
            container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:400px;color:var(--text-gray);font-size:14px;">TradingView yüklənir...</div>';
            return;
        }
        new TradingView.widget({
            container_id: 'trading-tv-container',
            autosize: true,
            symbol: symbol,
            interval: interval || 'D',
            timezone: 'Europe/Moscow',
            theme: 'dark',
            style: '1',
            locale: 'en',
            toolbar_bg: '#131722',
            enable_publishing: false,
            hide_top_toolbar: false,
            save_image: false,
            allow_symbol_change: false,
        });
    }

    window.setTradingTF = function(tf, btn) {
        tradingCurrentTF = tf;
        document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        if (tradingSelectedCoin) loadTradingViewChart(tvSymbolForCoin(tradingSelectedCoin.id), tf);
    };

    window.setOrderType = function(type) {
        tradingOrderType = type;
        document.getElementById('order-tab-buy')?.classList.toggle('active', type === 'buy');
        document.getElementById('order-tab-sell')?.classList.toggle('active', type === 'sell');
        document.getElementById('order-tab-swap')?.classList.toggle('active', type === 'swap');
        const normalPanel = document.getElementById('normal-order-panel');
        const swapPanel = document.getElementById('swap-panel');
        if (normalPanel) normalPanel.style.display = type === 'swap' ? 'none' : 'block';
        if (swapPanel) swapPanel.style.display = type === 'swap' ? 'block' : 'none';
        if (type === 'swap') {
            populateSwapSelectors();
        } else {
            const submitBtn = document.getElementById('order-submit-btn');
            if (submitBtn) {
                submitBtn.className = 'order-submit-btn ' + type;
                const icon = type === 'buy' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
                const label = type === 'buy' ? (window.t ? window.t('buy_btn') : 'Al') : (window.t ? window.t('sell_btn') : 'Sat');
                submitBtn.innerHTML = `<i class="fa-solid ${icon}"></i> ${label}`;
            }
            updateOrderTotal();
        }
    };

    function populateSwapSelectors() {
        const fromSel = document.getElementById('swap-from-coin');
        const toSel = document.getElementById('swap-to-coin');
        if (!fromSel || !toSel) return;

        // "From" options: USD + any coin you own
        const ownedCoins = Object.keys(wallet.assets).filter(id => (wallet.assets[id] || 0) > 0.000001);
        const fromOpts = [
            `<option value="usd">💵 USD</option>`,
            ...ownedCoins.map(id => {
                const coin = cryptoData.find(c => c.id === id);
                return coin ? `<option value="${id}">${coin.symbol.toUpperCase()} — ${coin.name}</option>` : '';
            }).filter(Boolean)
        ].join('');
        fromSel.innerHTML = fromOpts;

        // "To" options: all coins except the currently selected "from"
        const toOpts = cryptoData.map(c => `<option value="${c.id}">${c.symbol.toUpperCase()} — ${c.name}</option>`).join('');
        toSel.innerHTML = toOpts;

        // Pre-select the active trading coin as "to"
        if (tradingSelectedCoin) toSel.value = tradingSelectedCoin.id;

        updateSwapPreview();
    }

    window.updateSwapPreview = function() {
        const fromId = document.getElementById('swap-from-coin')?.value;
        const toId = document.getElementById('swap-to-coin')?.value;
        const fromAmount = parseFloat(document.getElementById('swap-from-amount')?.value) || 0;
        const rateEl = document.getElementById('swap-rate');
        const feeEl = document.getElementById('swap-fee');
        const receiveEl = document.getElementById('swap-receive-net');
        const toAmountEl = document.getElementById('swap-to-amount');
        const fromBalEl = document.getElementById('swap-from-balance');

        // Update available balance
        if (fromBalEl) {
            if (fromId === 'usd') {
                fromBalEl.textContent = 'Mövcud: $' + wallet.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } else {
                const held = wallet.assets[fromId] || 0;
                const coin = cryptoData.find(c => c.id === fromId);
                fromBalEl.textContent = 'Mövcud: ' + held.toFixed(6) + (coin ? ' ' + coin.symbol.toUpperCase() : '');
            }
        }

        if (!fromId || !toId || fromId === toId) { return; }

        const fromPriceUSD = fromId === 'usd' ? 1 : (cryptoData.find(c => c.id === fromId)?.current_price || 0);
        const toCoin = cryptoData.find(c => c.id === toId);
        const toPriceUSD = toCoin?.current_price || 0;
        if (!fromPriceUSD || !toPriceUSD) return;

        const fromUSD = fromAmount * fromPriceUSD;
        const fee = fromUSD * 0.001;
        const netUSD = fromUSD - fee;
        const toAmount = netUSD / toPriceUSD;
        const rate = fromPriceUSD / toPriceUSD;

        if (toAmountEl) toAmountEl.value = fromAmount > 0 ? toAmount.toFixed(6) : '';
        const fromSym = fromId === 'usd' ? 'USD' : (cryptoData.find(c => c.id === fromId)?.symbol.toUpperCase() || fromId);
        const toSym = toCoin?.symbol.toUpperCase() || toId;
        if (rateEl) rateEl.textContent = `1 ${fromSym} = ${rate.toFixed(6)} ${toSym}`;
        if (feeEl) feeEl.textContent = `$${fee.toFixed(4)}`;
        if (receiveEl) receiveEl.textContent = fromAmount > 0 ? `${toAmount.toFixed(6)} ${toSym}` : '--';
    };

    window.flipSwapCoins = function() {
        const fromSel = document.getElementById('swap-from-coin');
        const toSel = document.getElementById('swap-to-coin');
        const fromAmountEl = document.getElementById('swap-from-amount');
        const toAmountEl = document.getElementById('swap-to-amount');
        if (!fromSel || !toSel) return;
        const prevFrom = fromSel.value;
        const prevTo = toSel.value;
        // Repopulate from-selector to ensure the target coin is available
        populateSwapSelectors();
        // Try to set flipped values
        if ([...fromSel.options].some(o => o.value === prevTo)) fromSel.value = prevTo;
        if ([...toSel.options].some(o => o.value === prevFrom)) toSel.value = prevFrom;
        const receivedAmt = parseFloat(toAmountEl?.value) || 0;
        if (fromAmountEl && receivedAmt > 0) fromAmountEl.value = receivedAmt.toFixed(6);
        updateSwapPreview();
    };

    window.submitSwap = function() {
        const fromId = document.getElementById('swap-from-coin')?.value;
        const toId = document.getElementById('swap-to-coin')?.value;
        const fromAmount = parseFloat(document.getElementById('swap-from-amount')?.value) || 0;
        if (!fromId || !toId || fromId === toId) { showToast('Fərqli koinlər seçin!', 'danger'); return; }
        if (fromAmount <= 0) { showToast(window.t ? window.t('invalid_amount') : '⚠️ Miqdar daxil edin!', 'danger'); return; }

        const fromPriceUSD = fromId === 'usd' ? 1 : (cryptoData.find(c => c.id === fromId)?.current_price || 0);
        const toCoin = cryptoData.find(c => c.id === toId);
        if (!toCoin) { showToast('Koin tapılmadı!', 'danger'); return; }
        const toPriceUSD = toCoin.current_price;

        const fromUSD = fromAmount * fromPriceUSD;
        const fee = fromUSD * 0.001;
        const netUSD = fromUSD - fee;
        const toAmount = netUSD / toPriceUSD;

        // Check balance
        if (fromId === 'usd') {
            if (fromAmount > wallet.cash) { showToast((window.t ? window.t('insufficient_balance') : '⚠️ Balans çatmır!'), 'danger'); return; }
            wallet.cash -= fromAmount;
        } else {
            const held = wallet.assets[fromId] || 0;
            if (fromAmount > held) { showToast((window.t ? window.t('insufficient_coins') : '⚠️ Koin çatmır!'), 'danger'); return; }
            wallet.assets[fromId] = held - fromAmount;
            if (wallet.assets[fromId] < 0.000001) delete wallet.assets[fromId];
            // Reduce cost basis proportionally
            wallet.costBasis = wallet.costBasis || {};
            const costRatio = held > 0 ? fromAmount / held : 0;
            wallet.costBasis[fromId] = Math.max(0, (wallet.costBasis[fromId] || 0) * (1 - costRatio));
        }

        // Credit target coin
        wallet.assets[toId] = (wallet.assets[toId] || 0) + toAmount;
        wallet.costBasis = wallet.costBasis || {};
        wallet.costBasis[toId] = (wallet.costBasis[toId] || 0) + netUSD;

        // Record as swap transaction
        const fromSym = fromId === 'usd' ? 'USD' : (cryptoData.find(c => c.id === fromId)?.symbol.toUpperCase() || fromId);
        txHistory.unshift({ type: 'swap', coinId: toId, coinName: toCoin.name, symbol: toCoin.symbol.toUpperCase(), amount: toAmount, price: toPriceUSD, total: fromUSD, fromSym, fromAmount, date: new Date().toLocaleString('az-AZ') });

        // Clear input
        const inp = document.getElementById('swap-from-amount');
        if (inp) inp.value = '';
        document.getElementById('swap-to-amount') && (document.getElementById('swap-to-amount').value = '');

        localStorage.setItem('nexusTxHistory', JSON.stringify(txHistory));
        saveAndRefresh();
        updateOrderBalances();
        updateTradingHeaderStats();
        populateSwapSelectors();
        renderOrderRecentTrades();
        renderTradingCoinList();
        showToast(`✅ ${fromAmount.toFixed(4)} ${fromSym} → ${toAmount.toFixed(6)} ${toCoin.symbol.toUpperCase()} swap edildi!`, 'success');
    };

    window.updateOrderTotal = function() {
        if (!tradingSelectedCoin) return;
        const usdAmount = parseFloat(document.getElementById('order-usd-amount')?.value) || 0;
        const price = tradingSelectedCoin.current_price;
        const coinAmount = usdAmount / price;
        const fee = usdAmount * 0.001;
        const priceEl = document.getElementById('order-market-price');
        const receiveEl = document.getElementById('order-you-receive');
        const feeEl = document.getElementById('order-fee');
        const totalEl = document.getElementById('order-total-cost');
        if (priceEl) priceEl.textContent = '$' + price.toLocaleString();
        if (receiveEl) receiveEl.textContent = coinAmount > 0 ? coinAmount.toFixed(6) + ' ' + tradingSelectedCoin.symbol.toUpperCase() : '0 ' + tradingSelectedCoin.symbol.toUpperCase();
        if (feeEl) feeEl.textContent = '$' + fee.toFixed(4);
        if (totalEl) totalEl.textContent = '$' + usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    window.setOrderPct = function(pct) {
        if (!tradingSelectedCoin) return;
        const maxAmount = tradingOrderType === 'buy'
            ? wallet.cash
            : (wallet.assets[tradingSelectedCoin.id] || 0) * tradingSelectedCoin.current_price;
        const input = document.getElementById('order-usd-amount');
        if (input) input.value = (maxAmount * pct / 100).toFixed(2);
        updateOrderTotal();
    };

    function updateOrderBalances() {
        if (!tradingSelectedCoin) return;
        const cashEl = document.getElementById('order-available-cash');
        const coinEl = document.getElementById('order-coin-holdings');
        if (cashEl) cashEl.textContent = '$' + wallet.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const held = wallet.assets[tradingSelectedCoin.id] || 0;
        if (coinEl) coinEl.textContent = held.toFixed(6) + ' ' + tradingSelectedCoin.symbol.toUpperCase();
        updatePositionCard(tradingSelectedCoin);
    }

    window.submitTradingOrder = function() {
        if (!tradingSelectedCoin) { showToast('Koin seçin!', 'danger'); return; }
        const usdAmount = parseFloat(document.getElementById('order-usd-amount')?.value) || 0;
        if (usdAmount <= 0) { showToast(window.t ? window.t('invalid_amount') : '⚠️ Miqdar daxil edin!', 'danger'); return; }
        const coinId = tradingSelectedCoin.id;
        const price = tradingSelectedCoin.current_price;
        const coinAmount = usdAmount / price;
        if (tradingOrderType === 'buy') {
            if (usdAmount > wallet.cash) {
                showToast((window.t ? window.t('insufficient_balance') : '⚠️ Balans çatmır!') + ' $' + usdAmount.toFixed(2), 'danger');
                return;
            }
            wallet.cash -= usdAmount;
            wallet.assets[coinId] = (wallet.assets[coinId] || 0) + coinAmount;
            wallet.costBasis = wallet.costBasis || {};
            wallet.costBasis[coinId] = (wallet.costBasis[coinId] || 0) + usdAmount;
            txHistory.unshift({ type: 'buy', coinId, coinName: tradingSelectedCoin.name, symbol: tradingSelectedCoin.symbol.toUpperCase(), amount: coinAmount, price, total: usdAmount, date: new Date().toLocaleString('az-AZ') });
            showToast(`✅ ${coinAmount.toFixed(6)} ${tradingSelectedCoin.symbol.toUpperCase()} alındı`, 'success');
        } else {
            const heldCoins = wallet.assets[coinId] || 0;
            if (coinAmount > heldCoins + 0.000001) {
                showToast((window.t ? window.t('insufficient_coins') : '⚠️ Koin çatmır!') + ' ' + heldCoins.toFixed(6), 'danger');
                return;
            }
            const coinsToSell = Math.min(coinAmount, heldCoins);
            const actualUsd = coinsToSell * price;
            wallet.cash += actualUsd;
            wallet.assets[coinId] = heldCoins - coinsToSell;
            if (wallet.assets[coinId] < 0.000001) delete wallet.assets[coinId];
            wallet.costBasis = wallet.costBasis || {};
            const costRatio = heldCoins > 0 ? coinsToSell / heldCoins : 0;
            wallet.costBasis[coinId] = Math.max(0, (wallet.costBasis[coinId] || 0) * (1 - costRatio));
            txHistory.unshift({ type: 'sell', coinId, coinName: tradingSelectedCoin.name, symbol: tradingSelectedCoin.symbol.toUpperCase(), amount: coinsToSell, price, total: actualUsd, date: new Date().toLocaleString('az-AZ') });
            showToast(`✅ $${actualUsd.toFixed(2)} alındı (${coinsToSell.toFixed(6)} ${tradingSelectedCoin.symbol.toUpperCase()} satıldı)`, 'success');
        }
        const input = document.getElementById('order-usd-amount');
        if (input) input.value = '';
        localStorage.setItem('nexusTxHistory', JSON.stringify(txHistory));
        saveAndRefresh();
        updateOrderBalances();
        updateTradingHeaderStats();
        renderOrderRecentTrades();
        renderTradingCoinList();
    };

    function renderOrderRecentTrades() {
        const list = document.getElementById('order-recent-list');
        if (!list) return;
        const coinId = tradingSelectedCoin?.id;
        const trades = coinId ? txHistory.filter(t => t.coinId === coinId).slice(0, 5) : txHistory.slice(0, 5);
        if (trades.length === 0) {
            list.innerHTML = '<p style="color:var(--text-gray);font-size:12px;text-align:center;padding:10px 0;">Əməliyyat yoxdur</p>';
            return;
        }
        list.innerHTML = trades.map(t => {
            const typeLabel = t.type === 'buy' ? '▲ AL' : t.type === 'sell' ? '▼ SAT' : '⇄ SWAP';
            const typeClass = t.type === 'buy' ? 'buy' : t.type === 'sell' ? 'sell' : 'swap';
            const detail = t.type === 'swap'
                ? `${t.fromAmount?.toFixed(4) || ''} ${t.fromSym || ''} → ${t.amount.toFixed(4)} ${t.symbol}`
                : `${t.amount.toFixed(4)} ${t.symbol}`;
            return `<div class="order-trade-item">
                <div style="display:flex;flex-direction:column;gap:2px;">
                    <span class="oti-type ${typeClass}">${typeLabel}</span>
                    <span style="color:var(--text-gray);font-size:10px;">${t.date || ''}</span>
                </div>
                <div style="text-align:right;display:flex;flex-direction:column;gap:2px;">
                    <span style="color:white;font-weight:700;font-size:12px;">$${t.total.toFixed(2)}</span>
                    <span style="color:var(--text-gray);font-size:10px;">${detail}</span>
                </div>
            </div>`;
        }).join('');
    }

    window.filterTradingCoins = function() { renderTradingCoinList(); };

    // =====================================================
    // INIT & API
    // =====================================================
    async function initApp() {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false');
            if (!response.ok) throw new Error('API error');
            cryptoData = await response.json();
            renderCards();
            updateWalletDisplay(cryptoData);
            renderTicker();
            renderMarket(cryptoData);
            updateKPIs();
            checkAlerts();
            updateNotifBadge();
            if (document.getElementById('watchlist')?.classList.contains('active')) renderWatchlist();
            if (document.getElementById('converter')?.classList.contains('active')) initConverter();
            if (document.getElementById('trading')?.classList.contains('active')) { renderTradingCoinList(); }
            updateTradingHeaderStats();
        } catch (err) {
            console.error('API Xətası:', err);
            showToast(window.t('api_error'), 'danger');
        }
    }

    document.getElementById('global-search')?.addEventListener('input', function() {
        const q = this.value.toLowerCase();
        if (!q || cryptoData.length === 0) return;
        const found = cryptoData.find(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
        if (found) {
            const idx = cryptoData.indexOf(found);
            currentIndex = Math.floor(idx / 3) * 3;
            renderCards();
        }
    });

    document.getElementById('alert-modal')?.addEventListener('click', function(e) {
        if (e.target === this) closeAlertModal();
    });

    // Add balance modal close handlers
    document.getElementById('add-cash-modal')?.addEventListener('click', function(e) {
        if (e.target === this) closeAddCashModal();
    });
    document.getElementById('add-cash-close')?.addEventListener('click', closeAddCashModal);
    document.getElementById('add-cash-cancel')?.addEventListener('click', closeAddCashModal);
    document.getElementById('add-cash-input')?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') confirmAddCash();
        if (e.key === 'Escape') closeAddCashModal();
    });

    const style = document.createElement('style');
    style.textContent = `@keyframes slideInRight { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }`;
    document.head.appendChild(style);

    initApp();
    initPortfolioChart();
    updateUI();
    renderAlerts();
    updateNotifBadge();
    applyPrivacySettings();
    setInterval(initApp, 60000);
});
