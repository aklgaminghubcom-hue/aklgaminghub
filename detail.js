// Supabase Configuration
const SUPABASE_URL = "https://faynrrznpebyydolcvka.supabase.co";
const SUPABASE_KEY = "sb_publishable_E-GSwmmuw0WjkUi9RzR7Vg_2zR6TLL7";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SMART_LINK_URL = "https://www.profitableratecpmnetwork.com/n0vemi4e?key=a5cf2ac42fc3b28070b87afb456402e7";

document.addEventListener("DOMContentLoaded", function() {
    initTheme();
    loadGameDetails();
});

function initTheme() {
    const savedTheme = localStorage.getItem("akl_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("akl_theme", newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const btn = document.getElementById("themeToggleBtn");
    if (btn) {
        btn.textContent = theme === "dark" ? "☀️" : "🌙";
    }
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function goBack() {
    window.history.back();
}

async function loadGameDetails() {
    const gameId = getQueryParam('id') || getQueryParam('game');
    const container = document.getElementById("detailContent");
    
    if (!container) return;

    if (!gameId) {
        container.innerHTML = `<div class="detail-loading" style="color:red;">❌ Game ID not found in URL!</div>`;
        return;
    }

    const cacheKey = `akl_game_detail_${gameId}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(`${cacheKey}_time`);
    const CACHE_DURATION = 30 * 60 * 1000;

    let game = null;

    if (cachedData && cachedTime && (Date.now() - cachedTime < CACHE_DURATION)) {
        game = JSON.parse(cachedData);
    } else {
        try {
            const { data, error } = await supabase
                .from("games")
                .select("*")
                .eq("id", gameId)
                .single();

            if (error || !data) {
                container.innerHTML = `<div class="detail-loading" style="color:red;">❌ Game not found in database!</div>`;
                return;
            }

            game = data;
            localStorage.setItem(cacheKey, JSON.stringify(game));
            localStorage.setItem(`${cacheKey}_time`, Date.now());
        } catch (error) {
            console.error("Detail Load Error:", error);
            container.innerHTML = `<div class="detail-loading" style="color:red;">❌ Error loading game data.</div>`;
            return;
        }
    }

    document.title = `${game.name} - AKL Gaming HUB`;

    const coverImage = game.image || game.cover || game.icon || "";
    const coverHTML = isImageURL(coverImage) 
        ? `<div class="detail-cover"><img src="${escapeHTML(coverImage)}" alt="${escapeHTML(game.name)}" class="detail-cover-image"></div>` 
        : `<div class="detail-cover"><div class="detail-cover-icon">${escapeHTML(coverImage || '🎮')}</div></div>`;

    let totalRating = game.totalRating || Number(game.rating || 5.0);
    let ratingCount = game.ratingCount || (game.total_ratings !== undefined ? game.total_ratings : 1);
    let currentAvg = (totalRating / (ratingCount > 0 ? ratingCount : 1)).toFixed(1);

    let formattedDate = "Recent";
    if (game.createdAt) {
        formattedDate = new Date(game.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    let featuresList = game.features;
    if (typeof featuresList === 'string') {
        try {
            featuresList = JSON.parse(featuresList);
        } catch (e) {
            featuresList = featuresList.split(',').map(f => f.trim());
        }
    }

    let featuresHTML = "";
    if (Array.isArray(featuresList) && featuresList.length > 0) {
        featuresHTML = `
            <div class="detail-section">
                <h3 class="detail-section-title">✨ Key Features</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${featuresList.map(f => `<span style="display:inline-block; padding:6px 12px; background:rgba(59,130,246,0.12); color:#3b82f6; font-size:12px; font-weight:600; border-radius:20px; border:1px solid rgba(59,130,246,0.3);">${escapeHTML(f)}</span>`).join("")}
                </div>
            </div>
        `;
    }

    let screenshotsList = game.screenshots;
    if (typeof screenshotsList === 'string') {
        try {
            screenshotsList = JSON.parse(screenshotsList);
        } catch (e) {
            screenshotsList = [];
        }
    }

    const screenshotsHTML = Array.isArray(screenshotsList) && screenshotsList.length > 0 ? `
        <div class="detail-section">
            <div class="screenshots-heading">
                <h3 class="detail-section-title" style="margin:0;">📸 Screenshots</h3>
                <span class="screenshot-count">${screenshotsList.length} Photos</span>
            </div>
            <div class="screenshots-scroll" style="margin-top: 10px;">
                ${screenshotsList.map((s, idx) => `
                    <div class="screenshot-card">
                        <img src="${escapeHTML(s.trim())}" alt="Screenshot ${idx + 1}" loading="lazy">
                        <div class="screenshot-number">${idx + 1}</div>
                    </div>
                `).join("")}
            </div>
        </div>
    ` : "";

    let originalUrl = game.originalLink || "";
    let modUrl = game.modLink || "";
    let legacyUrl = game.dataDownloadUrl || game.downloadUrl || "";

    const hasBothLinks = (originalUrl && modUrl);
    const singleLink = originalUrl || modUrl || legacyUrl;
    const hasAnyLink = hasBothLinks || singleLink || game.obb_link;

    let downloadButtonsHTML = "";

    if (hasBothLinks) {
        downloadButtonsHTML = `
            <button class="download-trigger-btn" data-link="${escapeHTML(originalUrl)}" data-text="📥 Download Original Version" style="background: linear-gradient(135deg, #f59e0b, #d97706); width: 100%; cursor:pointer; border:none; padding:12px; border-radius:10px; color:#fff; font-weight:bold; position:relative; overflow:hidden;">📥 Download Original Version</button>
            <button class="download-trigger-btn" data-link="${escapeHTML(modUrl)}" data-text="⚡ Download Mod Version" style="background: linear-gradient(135deg, #10b981, #059669); width: 100%; cursor:pointer; border:none; padding:12px; border-radius:10px; color:#fff; font-weight:bold; position:relative; overflow:hidden;">⚡ Download Mod Version</button>
        `;
    } else if (singleLink) {
        downloadButtonsHTML = `
            <button class="download-trigger-btn" data-link="${escapeHTML(singleLink)}" data-text="📥 Download Now" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); width: 100%; cursor:pointer; border:none; padding:12px; border-radius:10px; color:#fff; font-weight:bold; position:relative; overflow:hidden;">📥 Download Now</button>
        `;
    }

    if (game.obb_link) {
        downloadButtonsHTML += `
            <button class="download-trigger-btn" data-link="${escapeHTML(game.obb_link)}" data-text="📦 Download OBB Data" style="background: linear-gradient(135deg, #00838f, #00acc1); width: 100%; cursor:pointer; border:none; padding:12px; border-radius:10px; color:#fff; font-weight:bold; position:relative; overflow:hidden;">📦 Download OBB Data</button>
        `;
    }

    const downloadSectionHTML = hasAnyLink ? `
        <div class="download-section">
            <div class="download-section-header">
                <h2>Download Links</h2>
                <span>Get the latest version securely</span>
            </div>
            
            <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; color: var(--text-color); line-height: 1.6;">
                💡 <b>ဒေါင်းလုဒ်ဆွဲနည်း လမ်းညွှန်ချက်:</b><br>
                ၁။ Download ခလုတ်ကို နှိပ်ပါက ကြော်ငြာ တက်လာပါမည်။<br>
                ၂။ (ကြော်ငြာတက်လာပါက Back ဖြင့် ဤစာမျက်နှာသို့ ပြန်လာပါ)<br>
                ၃။ အတန်းလေး တစ်ခါပြေးပြီးဆုံးသည်အထိ ခဏစောင့်ပါ။<br>
                ၄။ ပြီးပါက တကယ့် ဒေါင်းလုဒ်လင့်ခ်အစစ် ပေါ်လာမည်ဖြစ်ပြီး APK ဖိုင်ကို ဆက်လက် ဒေါင်းလုဒ်ဆွဲနိုင်ပါပြီ။
            </div>

            <div class="download-section-buttons" style="display: flex; flex-direction: column; gap: 10px;">
                ${downloadButtonsHTML}
            </div>
            
            <p class="download-note" style="margin-top: 12px;">By downloading, you agree to our terms and privacy policy.</p>
        </div>
    ` : `
        <div class="download-section">
            <div style="color: #f59e0b; text-align: center; font-weight: 600;">⚠️ No download link available for this game yet.</div>
        </div>
    `;

    container.innerHTML = `
        <div class="game-detail-page">
            <div class="detail-hero">
                ${coverHTML}
                <div class="detail-title-area">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span class="detail-platform">🕹️ ${escapeHTML(String(game.platform || "ANDROID").toUpperCase())}</span>
                        <span style="font-size: 12px; color: var(--meta-text); background: rgba(255,255,255,0.08); padding: 3px 8px; border-radius: 6px;">📅 ${formattedDate}</span>
                    </div>
                    <h1 class="detail-game-name">${escapeHTML(game.name)}</h1>
                    
                    <div class="detail-info-grid">
                        <div class="info-box">
                            <span class="info-label">Version</span>
                            <strong>${escapeHTML(game.version || "1.0")}</strong>
                        </div>
                        <div class="info-box">
                            <span class="info-label">File Size</span>
                            <strong>${escapeHTML(game.size || "Unknown")}</strong>
                        </div>
                        <div class="info-box">
                            <span class="info-label">Category / Type</span>
                            <strong>${escapeHTML(game.type || "Original")}</strong>
                        </div>
                        <div class="info-box">
                            <span class="info-label">Rating</span>
                            <strong style="color: #fbbf24;">★ <span id="avgRatingText">${currentAvg}</span> (${ratingCount})</strong>
                        </div>
                    </div>

                    <div style="padding-top: 10px; border-top: 1px solid var(--card-border); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                        <span style="font-size: 13px;">Rate this game:</span>
                        <div id="starContainer" style="display: flex; gap: 6px; cursor: pointer;">
                            <span class="star" data-value="1" style="font-size: 22px; color: #555;">★</span>
                            <span class="star" data-value="2" style="font-size: 22px; color: #555;">★</span>
                            <span class="star" data-value="3" style="font-size: 22px; color: #555;">★</span>
                            <span class="star" data-value="4" style="font-size: 22px; color: #555;">★</span>
                            <span class="star" data-value="5" style="font-size: 22px; color: #555;">★</span>
                        </div>
                        <span id="ratingMsg" style="font-size: 12px; color: #10b981; font-weight: bold;"></span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3 class="detail-section-title">About Game</h3>
                <div class="description-box">
                    <p style="margin: 0; white-space: pre-line;">${escapeHTML(game.description || "No description available.")}</p>
                </div>
            </div>

            ${featuresHTML}
            ${screenshotsHTML}

            <div class="download-area">
                ${downloadSectionHTML}
            </div>

            <div id="popularGamesContainer"></div>
        </div>
    `;

    setupDownloadTriggers();
    setupRatingSystem(gameId, totalRating, ratingCount);
    loadLatestGames(gameId);
}

function setupDownloadTriggers() {
    const downloadBtns = document.querySelectorAll('.download-trigger-btn');

    downloadBtns.forEach(btn => {
        let isProcessing = false;

        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (isProcessing) return;

            const targetUrl = this.getAttribute('data-link');
            const originalText = this.getAttribute('data-text');

            if (this.getAttribute('data-ready') === 'true') {
                if (targetUrl) {
                    const a = document.createElement('a');
                    a.href = targetUrl;
                    a.target = '_blank';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
                return;
            }

            isProcessing = true;
            this.style.pointerEvents = 'none';

            window.open(SMART_LINK_URL, '_blank');

            this.innerHTML = `
                <span>⏳ Generating Link...</span>
                <div style="position: absolute; bottom: 0; left: 0; height: 4px; width: 100%; background: rgba(255,255,255,0.3);">
                    <div class="progress-bar-fill" style="height: 100%; width: 0%; background: #ffffff; transition: width 3s linear;"></div>
                </div>
            `;

            setTimeout(() => {
                const fill = this.querySelector('.progress-bar-fill');
                if (fill) fill.style.width = '100%';
            }, 50);

            setTimeout(() => {
                this.style.pointerEvents = 'auto';
                isProcessing = false;
                this.setAttribute('data-ready', 'true');
                this.style.background = "linear-gradient(135deg, #22c55e, #15803d)";
                this.innerHTML = `✅ ${originalText} (Ready)`;
            }, 3000);
        });
    });
}

async function loadLatestGames(currentId) {
    const popularContainer = document.getElementById("popularGamesContainer");
    if (!popularContainer) return;

    try {
        const { data, error } = await supabase
            .from("games")
            .select("*")
            .order("createdAt", { ascending: false })
            .limit(40);

        if (error) throw error;

        let html = `
            <div style="margin-top: 30px;">
                <h3 style="margin-bottom: 12px; font-size: 18px; font-weight: 800;">✨ New Games</h3>
                <div style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 10px; scrollbar-width: none;">
        `;

        (data || []).forEach((game) => {
            if (game.id === currentId) return;
            const gameImg = game.icon || game.image || "🎮";

            html += `
                <a href="detail.html?id=${game.id}" style="text-decoration:none; background:var(--card-bg); padding:10px; border-radius:12px; flex: 0 0 130px; width: 130px; border: 1px solid var(--card-border); display: block;">
                    <img src="${escapeHTML(gameImg)}" style="width:100%; height:110px; object-fit:cover; border-radius:8px;">
                    <h4 style="color:var(--text-color); font-size:12px; margin:8px 0 2px 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(game.name)}</h4>
                    <p style="color:var(--meta-text); font-size:10px; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(game.type || 'Android')}</p>
                </a>
            `;
        });
        
        html += `</div></div>`;
        popularContainer.innerHTML = html;
    } catch (e) {
        console.error("Latest games load error:", e);
    }
}

function setupRatingSystem(gameId, currentTotal, currentCount) {
    const stars = document.querySelectorAll('.star');
    const msg = document.getElementById('ratingMsg');
    const avgText = document.getElementById('avgRatingText');

    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const val = this.getAttribute('data-value');
            stars.forEach(s => {
                if (s.getAttribute('data-value') <= val) {
                    s.style.color = '#fbbf24';
                } else {
                    s.style.color = '#555';
                }
            });
        });

        star.addEventListener('mouseout', function() {
            stars.forEach(s => s.style.color = '#555');
        });

        star.addEventListener('click', async function() {
            const selectedVal = parseInt(this.getAttribute('data-value'));
            stars.forEach(s => s.style.pointerEvents = 'none');
            
            try {
                const newTotal = currentTotal + selectedVal;
                const newCount = currentCount + 1;
                const newAvg = (newTotal / newCount).toFixed(1);

                const { error } = await supabase
                    .from("games")
                    .update({
                        totalRating: newTotal,
                        ratingCount: newCount,
                        rating: parseFloat(newAvg)
                    })
                    .eq("id", gameId);

                if (error) throw error;

                avgText.textContent = newAvg;
                msg.textContent = "Thank you! ⭐";
                stars.forEach(s => {
                    if (s.getAttribute('data-value') <= selectedVal) {
                        s.style.color = '#fbbf24';
                    }
                });
            } catch (err) {
                console.error("Rating update error:", err);
                msg.style.color = "#f87171";
                msg.textContent = "Failed!";
            }
        });
    });
}

function isImageURL(value) { 
    return typeof value === "string" && /^https?:\/\//i.test(value); 
}

function escapeHTML(value) { 
    if (value === null || value === undefined) return "";
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); 
}

window.goBack = goBack;
window.toggleTheme = toggleTheme;
