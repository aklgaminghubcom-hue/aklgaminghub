// Supabase Configuration
const SUPABASE_URL = "https://faynrrznpebyydolcvka.supabase.co";
const SUPABASE_KEY = "sb_publishable_E-GSwmmuw0WjkUi9RzR7Vg_2zR6TLL7";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let allItems = []; 

window.toggleTheme = function() {
    const body = document.body;
    const btn = document.getElementById('themeToggleBtn');
    body.classList.toggle('light-theme');
    
    if (body.classList.contains('light-theme')) {
        if(btn) btn.textContent = '☀️';
        localStorage.setItem('theme', 'light');
    } else {
        if(btn) btn.textContent = '🌙';
        localStorage.setItem('theme', 'dark');
    }
};

async function loadGamesFromSupabase() {
    const CACHE_KEY = "akl_cached_games";
    const CACHE_TIME_KEY = "akl_cache_time";
    const CACHE_DURATION = 30 * 60 * 1000; 

    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    const now = new Date().getTime();

    if (cachedData && cachedTime && (now - cachedTime < CACHE_DURATION)) {
        try {
            allItems = JSON.parse(cachedData);
            await loadSiteSettings();
            renderHomeSections(allItems);
            return;
        } catch (e) {
            console.error("Cache parse error:", e);
        }
    }

    try {
        const { data, error } = await supabase
            .from("games")
            .select("*")
            .order("createdAt", { ascending: false });

        if (error) throw error;

        let rawGames = (data || []).map(game => {
            let timeVal = 0;
            if (game.createdAt) {
                timeVal = new Date(game.createdAt).getTime() || 0;
            }
            return { ...game, createdAtVal: timeVal };
        });

        const uniqueMap = new Map();
        rawGames.forEach(g => {
            if (!uniqueMap.has(g.id)) {
                uniqueMap.set(g.id, g);
            }
        });

        allItems = Array.from(uniqueMap.values());

        localStorage.setItem(CACHE_KEY, JSON.stringify(allItems));
        localStorage.setItem(CACHE_TIME_KEY, now.toString());
        
        await loadSiteSettings();
        renderHomeSections(allItems);
    } catch (error) {
        console.error("❌ Load error:", error);
        if (cachedData) {
            allItems = JSON.parse(cachedData);
            await loadSiteSettings();
            renderHomeSections(allItems);
        } else {
            showError();
        }
    }
}

async function loadSiteSettings() {
    try {
        const { data, error } = await supabase
            .from("settings")
            .select("*")
            .eq("id", "home_config")
            .single();
        
        let banners = [
            "https://i.ibb.co/jpyPF1J/Chat-GPT-Image-Sep-19-2026-03-20-56-PM.png"
        ];
        let noticeText = "💡 ဂိမ်းဒေါင်းလုဒ်လုပ်တာ အဆင်မပြေဖြစ်ခဲ့ရင် အပေါ်ဘက်ရှိ 📢 Join TG လင့်ခ်ကနေတစ်ဆင့် ဂိမ်းဒေါင်းနည်းကို ဝင်ရောက်ကြည့်ရှုနိုင်ပါတယ်ခင်ဗျာ 🚀";

        if (data) {
            if (data.banners && Array.isArray(data.banners) && data.banners.length > 0) {
                banners = data.banners;
            }
            if (data.notice) {
                noticeText = data.notice;
            }
        }

        renderHeroBannerSlider(banners);
        const noticeEl = document.getElementById("runningNoticeText");
        if (noticeEl) noticeEl.textContent = noticeText;
    } catch (e) {
        console.error("Error loading settings:", e);
        renderHeroBannerSlider(["https://i.ibb.co/jpyPF1J/Chat-GPT-Image-Sep-19-2026-03-20-56-PM.png"]);
    }
}

function renderHeroBannerSlider(banners) {
    const container = document.getElementById("heroBannerCard");
    if (!container) return;

    container.innerHTML = `
        <div class="banner-slider-track" id="bannerSliderTrack">
            ${banners.map(url => `
                <div class="banner-slide-item">
                    <img src="${escapeHTML(url)}" alt="Banner">
                </div>
            `).join('')}
        </div>
    `;

    const track = document.getElementById('bannerSliderTrack');
    if (!track || banners.length <= 1) return;

    let index = 0;
    setInterval(() => {
        index = (index + 1) % banners.length;
        track.style.transform = `translateX(-${index * 100}%)`;
    }, 3500);
}

function renderHomeSections(items) {
    const container = document.getElementById("dynamicSectionsContainer");
    if (!container) return;

    const games = items.filter(item => {
        const platform = String(item.platform || "").toLowerCase();
        const category = String(item.category || item.type || item.features || "").toLowerCase();
        const isApp = platform === 'app' || category.includes('app') || category.includes('utility') || category.includes('tool');
        return !isApp;
    });

    const apps = items.filter(item => {
        const platform = String(item.platform || "").toLowerCase();
        const category = String(item.category || item.type || item.features || "").toLowerCase();
        const isApp = platform === 'app' || category.includes('app') || category.includes('utility') || category.includes('tool');
        return isApp;
    });

    if (items.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted);">အချက်အလက်များ မရှိသေးပါ။</div>`;
        return;
    }

    const sortByDateDesc = (arr) => {
        return [...arr].sort((a, b) => b.createdAtVal - a.createdAtVal);
    };

    const renderedGlobalIds = new Set();

    const getUniqueSectionList = (list, limit = 10) => {
        const uniqueList = [];
        for (const game of list) {
            if (!renderedGlobalIds.has(game.id)) {
                renderedGlobalIds.add(game.id);
                uniqueList.push(game);
                if (uniqueList.length >= limit) break;
            }
        }
        return uniqueList;
    };

    const sortedGames = sortByDateDesc(games);

    const editorChoice = sortByDateDesc(games.filter(i => i.isHot === true || i.isHot === "true"));
    const topNew = sortByDateDesc(games.filter(i => i.isNew === true || i.isNew === "true"));

    const filterByKeywords = (keywords) => sortByDateDesc(games.filter(i => {
        const text = (String(i.name || "") + " " + String(i.platform || "") + " " + String(i.category || "") + " " + String(i.type || "") + " " + (Array.isArray(i.features) ? i.features.join(" ") : String(i.features || ""))).toLowerCase();
        return keywords.some(kw => text.includes(kw.toLowerCase()));
    }));

    const adventureGames = filterByKeywords(['adventure']);
    const openWorldGames = filterByKeywords(['open world', 'openworld']);
    const warGames = filterByKeywords(['war', 'world war', 'military', 'battle']);
    const shootingGames = filterByKeywords(['shooting', 'shooter', 'gun']);
    const survivalGames = filterByKeywords(['survival']);
    const hackAndSlashGames = filterByKeywords(['hack', 'slash', 'hack&slash']);
    const racingGames = filterByKeywords(['racing', 'driving', 'car']); 
    const truckGames = filterByKeywords(['truck', 'lorry', 'euro truck', 'american truck']);
    const horrorGames = filterByKeywords(['horror']);
    const huntingGames = filterByKeywords(['hunting', 'hunter']);
    const rtsGames = filterByKeywords(['rts', 'strategy', 'real time strategy']);
    const cozyGames = filterByKeywords(['cozy', 'relaxing', 'farming']);
    const simulationGames = filterByKeywords(['simulation']);
    const puzzleGames = filterByKeywords(['puzzle', 'brain', 'logic']);
    const smallGames = sortByDateDesc(games.filter(i => i.isSmallGame === true || i.isSmallGame === "true" || String(i.platform || "").toUpperCase() === 'SMALL'));
    const popular = sortByDateDesc(games.filter(i => !i.isHot && !i.isNew && !i.isSmallGame));

    let html = '';

    html += createIconRowSection(`⭐ အယ်ဒီတာ့ရွေးချယ်မှု ဂိမ်းများ`, getUniqueSectionList(editorChoice.length > 0 ? editorChoice : sortedGames), 'HOT');
    html += createIconRowSection(`🔥 ဂိမ်းအသစ်စက်စက်များ`, getUniqueSectionList(topNew.length > 0 ? topNew : sortedGames), 'NEW');

    html += createBannerCardSection(`🌟 လူကြိုက်အများဆုံး ဂိမ်းများ`, getUniqueSectionList(popular), 'POPULAR');
    html += createBannerCardSection(`🗺️ စွန့်စားခန်းနှင့် ခရီးသွားဂိမ်းများ`, getUniqueSectionList(adventureGames), 'ADVENTURE');
    html += createBannerCardSection(`🌍 Open World ဂိမ်းများ`, getUniqueSectionList(openWorldGames), 'OPEN WORLD');

    if (apps.length > 0) {
        html += createIconRowSection(`📱 အသုံးဝင်သော အက်ပ်များနှင့် တူးလ်များ`, getUniqueSectionList(sortByDateDesc(apps)), 'APP');
    }

    html += createSmallGamesRowSection(`📦 ဖိုင်ဆိုဒ်သေး ဂိမ်းများ (Lite)`, getUniqueSectionList(smallGames), 'SMALL');

    html += createBannerCardSection(`⚔️ စစ်ပွဲနှင့် ကမ္ဘာစစ်ဂိမ်းများ`, getUniqueSectionList(warGames), 'WAR GAMES');
    html += createBannerCardSection(`🎯 ပစ်ခတ်ရေး သေနတ်ပစ်ဂိမ်းများ`, getUniqueSectionList(shootingGames), 'SHOOTING');
    html += createBannerCardSection(`🛡️ အသက်ရှင်ရပ်တည်ရေး ဂိမ်းများ`, getUniqueSectionList(survivalGames), 'SURVIVAL');
    html += createIconRowSection(`🗡️ လက်ပစ်ဓားထိုး တိုက်ခိုက်ရေးဂိမ်းများ`, getUniqueSectionList(hackAndSlashGames), 'HACK & SLASH');

    html += createBannerCardSection(`🏎️ ကားမောင်းနှင့် ပြိုင်ကားဂိမ်းများ`, getUniqueSectionList(racingGames), 'RACING');
    html += createBannerCardSection(`🚛 ထရပ်ကားနှင့် ကားကြီးမောင်း Simulation ဂိမ်းများ`, getUniqueSectionList(truckGames), 'TRUCK');
    html += createBannerCardSection(`👻 ကြောက်စရာ ဟောရာ့ဂိမ်းများ`, getUniqueSectionList(horrorGames), 'HORROR');
    html += createBannerCardSection(`🏹 တောရိုင်းတိရစ္ဆာန် အမဲလိုက်ဂိမ်းများ`, getUniqueSectionList(huntingGames), 'HUNTING');
    html += createBannerCardSection(`⚡ ဗျူဟာခင်းရသော RTS ဂိမ်းများ`, getUniqueSectionList(rtsGames), 'RTS');
    html += createBannerCardSection(`🏡 အိမ်တွင်းအလှဆင် အနားယူစရာ ဂိမ်းများ`, getUniqueSectionList(cozyGames), 'COZY');
    html += createBannerCardSection(`🎮 တကယ့်ဘဝတူ Simulation ဂိမ်းများ`, getUniqueSectionList(simulationGames), 'SIMULATION');
    html += createBannerCardSection(`🧩 ဦးနှောက်စား ပဟေဠိဂိမ်းများ`, getUniqueSectionList(puzzleGames), 'PUZZLE');

    container.innerHTML = html;
}

function createIconRowSection(title, list, categoryKey) {
    if (!list || list.length === 0) return '';
    return `
        <div class="section-block" style="margin-bottom: 22px;">
            <div class="section-header-flex" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h2 class="section-title" style="font-size: 15px; font-weight: 700;">${title}</h2>
                <a href="category.html?cat=${categoryKey}&type=game" class="see-all-link" style="font-size: 13px; color: var(--accent-color); text-decoration: none; font-weight: 600;">အားလုံးကြည့်ရန် &gt;</a>
            </div>
            <div class="icon-scroll-row">
                ${list.map(game => {
                    const iconImg = game.icon || game.image || "";
                    const name = game.name || game.title || "Unknown";
                    return `
                        <a href="detail.html?id=${escapeHTML(game.id)}" class="icon-card-item">
                            <div class="icon-card-img-box">
                                <img src="${escapeHTML(iconImg)}" alt="${escapeHTML(name)}" onerror="this.src='default.png'">
                            </div>
                            <div class="icon-card-title">${escapeHTML(name)}</div>
                        </a>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function createSmallGamesRowSection(title, list, categoryKey) {
    if (!list || list.length === 0) return '';
    const columns = [];
    for (let i = 0; i < list.length; i += 3) {
        columns.push(list.slice(i, i + 3));
    }

    return `
        <div class="section-block" style="margin-bottom: 22px;">
            <div class="section-header-flex" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h2 class="section-title" style="font-size: 15px; font-weight: 700;">${title}</h2>
                <a href="category.html?cat=${categoryKey}&type=game" class="see-all-link" style="font-size: 13px; color: var(--accent-color); text-decoration: none; font-weight: 600;">အားလုံးကြည့်ရန် &gt;</a>
            </div>
            <div class="small-games-grid-row">
                ${columns.map(col => `
                    <div class="small-games-column">
                        ${col.map(game => {
                            const iconImg = game.icon || game.image || "";
                            const name = game.name || game.title || "Unknown";
                            const size = game.size || "15 MB";
                            return `
                                <a href="detail.html?id=${escapeHTML(game.id)}" class="small-game-mini-card">
                                    <img src="${escapeHTML(iconImg)}" alt="Icon" class="small-game-mini-icon" onerror="this.src='default.png'">
                                    <div style="min-width:0; flex:1;">
                                        <div style="font-size: 13px; font-weight: 700; color: var(--text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(name)}</div>
                                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${escapeHTML(size)} • ${escapeHTML(game.type || "Original")}</div>
                                    </div>
                                </a>
                            `;
                        }).join('')}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function createBannerCardSection(title, list, categoryKey) {
    if (!list || list.length === 0) return '';
    return `
        <div class="section-block" style="margin-bottom: 25px;">
            <div class="section-header-flex" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h2 class="section-title" style="font-size: 16px; font-weight: 800;">${title}</h2>
                <a href="category.html?cat=${categoryKey}&type=game" class="see-all-link" style="font-size: 13px; color: var(--accent-color); text-decoration: none; font-weight: 700;">အားလုံးကြည့်ရန် &gt;</a>
            </div>
            <div class="banner-card-scroll-row">
                ${list.map(game => {
                    const screenshots = Array.isArray(game.screenshots) ? game.screenshots : [];
                    const bannerImg = screenshots[0] || game.image || game.coverUrl || game.icon || "";
                    const iconImg = game.icon || game.image || "";
                    const name = game.name || game.title || "Unknown";
                    const size = game.size || "45 MB";
                    const version = game.version ? `v${game.version}` : "v1.0.0";
                    const modInfo = game.type === "MOD" ? "⚡ မွမ်းမံပြီး (Modded)" : (game.features ? game.features[0] : "မူရင်းဗားရှင်း (Original)");
                    
                    return `
                        <div class="large-banner-card" onclick="window.location.href='detail.html?id=${escapeHTML(game.id)}'" style="cursor: pointer;">
                            <img src="${escapeHTML(bannerImg)}" alt="${escapeHTML(name)}" class="large-banner-img" onerror="this.src='default.png'">
                            <div class="large-banner-details">
                                <div class="banner-info-left">
                                    <img src="${escapeHTML(iconImg)}" alt="Icon" class="banner-icon-img" onerror="this.src='default.png'">
                                    <div class="banner-text-group">
                                        <div class="banner-title">${escapeHTML(name)}</div>
                                        <div class="banner-meta">${escapeHTML(size)} •${escapeHTML(version)}</div>
                                        <div class="banner-mod">🛠️ ${escapeHTML(modInfo)}</div>
                                    </div>
                                </div>
                                <button class="play-btn-pill" onclick="event.stopPropagation(); window.location.href='detail.html?id=${escapeHTML(game.id)}'">ဒေါင်းလုဒ်</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function setupSearch() {
    const input = document.getElementById("searchInput");
    const container = document.getElementById("dynamicSectionsContainer");
    if (!input || !container) return;

    input.addEventListener("input", (e) => {
        const queryStr = e.target.value.toLowerCase().trim();
        if (queryStr === '') {
            renderHomeSections(allItems);
            return;
        }

        const filtered = allItems.filter(item => {
            const name = String(item.name || item.title || "").toLowerCase();
            return name.includes(queryStr);
        });

        container.innerHTML = `
            <div class="section-title" style="margin-bottom: 15px;">🔍 ရှာဖွေတွေ့ရှိမှုများ (${filtered.length})</div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${filtered.map(game => {
                    const iconImg = game.icon || game.image || "";
                    const name = game.name || game.title || "Unknown";
                    const size = game.size || "45 MB";
                    return `
                        <a href="detail.html?id=${escapeHTML(game.id)}" style="display: flex; align-items: center; gap: 12px; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 10px; text-decoration: none; color: inherit;">
                            <img src="${escapeHTML(iconImg)}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover;" onerror="this.src='default.png'">
                            <div>
                                <div style="font-size: 14px; font-weight: 700; color: var(--text-color);">${escapeHTML(name)}</div>
                                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${escapeHTML(size)} •${escapeHTML(game.type || "Original")}</div>
                            </div>
                        </a>
                    `;
                }).join('')}
            </div>
        `;
    });
}

window.goHomePage = function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    renderHomeSections(allItems);
};

function escapeHTML(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function showError() {
    const container = document.getElementById("dynamicSectionsContainer");
    if (!container) return;
    container.innerHTML = `<div style="text-align:center; padding:40px; color:#ff5252;">❌ ဒေတာများ Load လုပ်၍မရပါ။</div>`;
}

document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem('theme');
    const btn = document.getElementById('themeToggleBtn');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if (btn) btn.textContent = '☀️';
    }

    setupSearch();
    loadGamesFromSupabase();
});
