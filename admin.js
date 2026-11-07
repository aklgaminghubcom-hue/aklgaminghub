let editingGameId = null;
let allGames = []; 

const ADMIN_SECRET_KEY = "Aungmyosat12";

// Supabase Configuration
const SUPABASE_URL = "https://faynrrznpebyydolcvka.supabase.co";
const SUPABASE_KEY = "sb_publishable_E-GSwmmuw0WjkUi9RzR7Vg_2zR6TLL7";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function verifyAdminPassword() {
    const inputPass = document.getElementById("adminPasswordInput").value;
    const rememberMe = document.getElementById("rememberMeCheckbox").checked;
    const errorMsg = document.getElementById("loginErrorMsg");

    if (inputPass === ADMIN_SECRET_KEY) {
        if (rememberMe) {
            localStorage.setItem("isAdminLoggedIn", "true");
        } else {
            sessionStorage.setItem("isAdminLoggedIn", "true");
        }
        
        document.getElementById("adminLoginModal").style.display = "none";
        document.getElementById("adminApp").style.display = "block";
        loadStatsAndGames();
    } else {
        errorMsg.style.display = "block";
    }
}

function adminLogout() {
    sessionStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("isAdminLoggedIn");
    location.reload();
}

document.addEventListener("DOMContentLoaded", function() {
    const isSessionLoggedIn = sessionStorage.getItem("isAdminLoggedIn");
    const isLocalLoggedIn = localStorage.getItem("isAdminLoggedIn");
    const loginModal = document.getElementById("adminLoginModal");
    const adminApp = document.getElementById("adminApp");

    if (isSessionLoggedIn === "true" || isLocalLoggedIn === "true") {
        if (loginModal) loginModal.style.display = "none";
        if (adminApp) adminApp.style.display = "block";
        loadStatsAndGames();
    } else {
        if (loginModal) loginModal.style.display = "flex";
        if (adminApp) adminApp.style.display = "none";
    }

    const searchInput = document.getElementById("gameSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function(e) {
            const keyword = e.target.value.toLowerCase().trim();
            const filtered = allGames.filter(game => 
                (game.name || "").toLowerCase().includes(keyword)
            );
            renderGamesList(filtered);
        });
    }
});

async function fetchSupabaseGames() {
    try {
        const { data, error } = await supabase
            .from("games")
            .select("*")
            .order("createdAt", { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("Error fetching games:", e);
        return [];
    }
}

async function loadStatsAndGames() {
    await checkAndPublishScheduledGames(); 
    await loadStats();
    await loadGames();
    await loadSiteSettingsAdmin();
}

async function checkAndPublishScheduledGames() {
    try {
        const games = await fetchSupabaseGames();
        const now = new Date();
        let hasChanges = false;

        for (const game of games) {
            if (game.status === "scheduled" && game.scheduledTime) {
                const schedDate = new Date(game.scheduledTime);
                if (now >= schedDate) {
                    await supabase
                        .from("games")
                        .update({ status: "published", scheduledTime: "" })
                        .eq("id", game.id);
                    hasChanges = true;
                }
            }
        }
    } catch (error) {
        console.error("Error checking scheduled games:", error);
    }
}

async function loadStats() {
    try {
        const games = await fetchSupabaseGames();
        const featured = games.filter(game => game.featured === true || game.featured === "true");
        document.getElementById("totalGames").textContent = games.length;
        document.getElementById("featuredGames").textContent = featured.length;
    } catch (error) {
        console.error("Stats Error:", error);
    }
}

async function loadGames() {
    try {
        allGames = await fetchSupabaseGames();
        renderGamesList(allGames);
        await loadStats();
    } catch (error) {
        console.error("Error loading games:", error);
    }
}

async function loadSiteSettingsAdmin() {
    try {
        const { data, error } = await supabase
            .from("settings")
            .select("*")
            .eq("id", "home_config")
            .single();

        if (data) {
            if (data.banners && Array.isArray(data.banners)) {
                const bannerInput = document.getElementById("bannerUrlsInput");
                if (bannerInput) bannerInput.value = data.banners.join(", ");
            }
            if (data.notice) {
                const noticeInput = document.getElementById("runningNoticeInput");
                if (noticeInput) noticeInput.value = data.notice;
            }
        }
    } catch (e) {
        console.error("Error loading admin settings:", e);
    }
}

window.saveSiteSettings = async function() {
    const bannersText = document.getElementById("bannerUrlsInput")?.value || "";
    const noticeText = document.getElementById("runningNoticeInput")?.value || "";

    const banners = bannersText.split(",").map(s => s.trim()).filter(Boolean);

    try {
        const { error } = await supabase
            .from("settings")
            .upsert({
                id: "home_config",
                banners: banners.length > 0 ? banners : ["https://i.ibb.co/jpyPF1J/Chat-GPT-Image-Sep-19-2026-03-20-56-PM.png"],
                notice: noticeText
            });

        if (error) throw error;
        alert("✅ Banner နှင့် Notice များကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ!");
    } catch (e) {
        console.error("Error saving settings:", e);
        alert("❌ သိမ်းဆည်းရာတွင် အမှားအယွင်းရှိပါသည်ကွ။");
    }
};

window.checkDuplicateGameName = function(enteredName) {
    const warningEl = document.getElementById("duplicateWarning");
    const nameInput = document.getElementById("gameName");
    const editId = document.getElementById("editId").value;
    
    if (!warningEl || !nameInput) return;

    const cleanInput = enteredName.trim().toLowerCase();
    
    if (cleanInput === "") {
        warningEl.style.display = "none";
        nameInput.style.borderColor = "#444";
        return;
    }

    const isExists = allGames.some(g => {
        if (editId && String(g.id) === String(editId)) return false;
        return String(g.name || "").trim().toLowerCase() === cleanInput;
    });

    if (isExists) {
        warningEl.textContent = "⚠️ ဒီဂိမ်းက ထည့်ပြီးသားပါ (Database ထဲတွင် ရှိနှင့်ပြီးသား ဖြစ်ပါသည်)";
        warningEl.style.display = "block";
        nameInput.style.borderColor = "#ff5252";
    } else {
        warningEl.style.display = "none";
        nameInput.style.borderColor = "#10b981";
    }
};

function renderGamesList(gamesArray) {
    const container = document.getElementById("adminGamesList");
    if (!container) return;

    if (gamesArray.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:20px; color:#666;">📂 No items found.</div>`;
        return;
    }

    container.innerHTML = gamesArray.map(game => {
        const icon = game.icon || game.image || "🎮";
        const iconHTML = isImageURL(icon) 
            ? `<img src="${escapeHTML(icon)}" class="admin-game-icon-image" alt="${escapeHTML(game.name)}">` 
            : `<div class="admin-game-icon">${escapeHTML(icon)}</div>`;
        
        const rating = game.rating !== undefined && game.rating !== null ? Number(game.rating).toFixed(1) : "5.0";
        const hasObb = game.obb_link ? `<span style="font-size: 11px; background: #e0f7fa; color: #00838f; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">📦 OBB</span>` : "";
        const hasMod = game.modLink ? `<span style="font-size: 11px; background: #e8f5e9; color: #2e7d32; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">⚡ Mod</span>` : "";
        const hasOriginal = game.originalLink ? `<span style="font-size: 11px; background: #fff8e1; color: #f57f17; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">📥 Original</span>` : "";
        
        const isSmall = game.isSmallGame === true || game.isSmallGame === "true";
        const isHot = game.isHot === true || game.isHot === "true";
        const isNew = game.isNew === true || game.isNew === "true";
        const isUpdate = game.isUpdate === true || game.isUpdate === "true";
        const isScheduled = game.status === "scheduled";

        let badgesHTML = "";
        if (isScheduled) badgesHTML += `<span style="font-size: 10px; background: #9c27b0; color: #fff; padding: 2px 5px; border-radius: 4px; margin-left: 4px; font-weight: bold;">🕒 SCHEDULED</span>`;
        if (isHot) badgesHTML += `<span style="font-size: 10px; background: #ff5252; color: #fff; padding: 2px 5px; border-radius: 4px; margin-left: 4px; font-weight: bold;">HOT</span>`;
        if (isNew) badgesHTML += `<span style="font-size: 10px; background: #2196f3; color: #fff; padding: 2px 5px; border-radius: 4px; margin-left: 4px; font-weight: bold;">NEW</span>`;
        if (isUpdate) badgesHTML += `<span style="font-size: 10px; background: #ff9800; color: #fff; padding: 2px 5px; border-radius: 4px; margin-left: 4px; font-weight: bold;">UPDATE</span>`;
        if (isSmall) badgesHTML += `<span style="font-size: 10px; background: #00bcd4; color: #000; padding: 2px 5px; border-radius: 4px; margin-left: 4px; font-weight: bold;">SMALL</span>`;

        return `
            <div class="admin-game-item">
                <div class="admin-game-info">
                    ${iconHTML}
                    <div class="admin-game-details">
                        <div class="admin-game-name" title="${escapeHTML(game.name || "Unnamed")}">${escapeHTML(game.name || "Unnamed")} ${hasOriginal} ${hasMod} ${hasObb} ${badgesHTML}</div>
                        <div style="font-size: 12px; color: #888; margin-top: 4px;">★ ${rating} • ${escapeHTML(String(game.platform || "").toUpperCase())} • ${escapeHTML(game.type || "Original")}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 6px; margin-top: 8px;">
                    <button type="button" class="action-btn secondary" style="padding: 6px 10px; font-size: 12px; flex: 1;" onclick="editGame('${escapeHTML(String(game.id))}')">✏️ Edit</button>
                    <button type="button" class="action-btn danger" style="padding: 6px 10px; font-size: 12px; flex: 1;" onclick="deleteGame('${escapeHTML(String(game.id))}')">🗑️ Delete</button>
                </div>
            </div>
        `;
    }).join("");
}

function showAddForm() {
    const form = document.getElementById("gameForm");
    form.style.display = "block";
    document.getElementById("formTitle").textContent = "➕ Add New Item";
    document.getElementById("gameFormInputs").reset();
    document.getElementById("editId").value = "";
    document.getElementById("gamePlatform").value = "";
    document.getElementById("gameType").value = "Original";
    document.getElementById("gameScheduledTime").value = "";
    document.getElementById("gameIsSmall").checked = false;
    document.getElementById("gameIsHot").checked = false;
    document.getElementById("gameIsNew").checked = false;
    document.getElementById("gameIsUpdate").checked = false;
    document.getElementById("gameFeatured").checked = false;
    document.getElementById("duplicateWarning").style.display = "none";
    document.getElementById("gameName").style.borderColor = "#444";
    editingGameId = null;
    form.scrollIntoView({ behavior: "smooth" });
}

async function editGame(id) {
    try {
        const game = allGames.find(g => String(g.id) === String(id));
        if (!game) return alert("❌ Item not found!");

        editingGameId = game.id;
        document.getElementById("gameForm").style.display = "block";
        document.getElementById("formTitle").textContent = "✏️ Edit Item";
        document.getElementById("editId").value = game.id;

        document.getElementById("gameName").value = game.name || "";
        document.getElementById("gamePlatform").value = (game.platform || "").toLowerCase();
        document.getElementById("gameType").value = game.type || "Original";
        document.getElementById("gameVersion").value = game.version || "";
        document.getElementById("gameSize").value = game.size || "";
        document.getElementById("gameIcon").value = game.icon || game.image || "";
        document.getElementById("gameDescription").value = game.description || "";
        document.getElementById("gameFeatures").value = Array.isArray(game.features) ? game.features.join(", ") : (game.features || "");
        
        document.getElementById("gameOriginalLink").value = game.originalLink || game.dataDownloadUrl || game.downloadUrl || "";
        document.getElementById("gameModLink").value = game.modLink || game.wifiDownloadUrl || "";
        document.getElementById("gameObbUrl").value = game.obb_link || "";
        document.getElementById("gamePlayStoreUrl").value = game.playStoreUrl || "";
        document.getElementById("gameScheduledTime").value = game.scheduledTime || "";
        
        const screenshots = Array.isArray(game.screenshots) ? game.screenshots : [];
        document.getElementById("screenshot1").value = screenshots[0] || "";
        document.getElementById("screenshot2").value = screenshots[1] || "";
        document.getElementById("screenshot3").value = screenshots[2] || "";
        document.getElementById("screenshot4").value = screenshots[3] || "";
        
        document.getElementById("gameFeatured").checked = game.featured === true || game.featured === "true";
        document.getElementById("gameIsSmall").checked = game.isSmallGame === true || game.isSmallGame === "true";
        document.getElementById("gameIsHot").checked = game.isHot === true || game.isHot === "true";
        document.getElementById("gameIsNew").checked = game.isNew === true || game.isNew === "true";
        document.getElementById("gameIsUpdate").checked = game.isUpdate === true || game.isUpdate === "true";
        document.getElementById("duplicateWarning").style.display = "none";
        document.getElementById("gameName").style.borderColor = "#444";

        document.getElementById("gameForm").scrollIntoView({ behavior: "smooth" });
    } catch (error) {
        console.error("Edit Error:", error);
    }
}

function cancelForm() {
    document.getElementById("gameForm").style.display = "none";
    document.getElementById("gameFormInputs").reset();
    editingGameId = null;
}

async function saveGame(event) {
    event.preventDefault();

    const id = document.getElementById("editId").value.trim();
    const name = document.getElementById("gameName").value.trim();
    
    if (!id) {
        const cleanNewName = name.toLowerCase();
        const isDuplicate = allGames.some(g => String(g.name || "").trim().toLowerCase() === cleanNewName);
        if (isDuplicate) {
            alert(`⚠️ "ဒီဂိမ်းက ထည့်ပြီးသားပါ" (ဤဂိမ်းနာမည် "${name}" သည် Database ထဲတွင် ရှိနှင့်ပြီးသား ဖြစ်ပါသည်)`);
            return;
        }
    }

    const platform = document.getElementById("gamePlatform").value.toLowerCase();
    const type = document.getElementById("gameType").value;
    const version = document.getElementById("gameVersion").value.trim() || "1.0.0";
    const size = document.getElementById("gameSize").value.trim() || "Unknown";
    const icon = document.getElementById("gameIcon").value.trim() || "🎮";
    const description = document.getElementById("gameDescription").value.trim() || "No description available.";
    
    const featuresInput = document.getElementById("gameFeatures").value;
    const features = featuresInput ? featuresInput.split(",").map(i => i.trim()).filter(Boolean) : [];
    
    const originalLink = document.getElementById("gameOriginalLink").value.trim();
    const modLink = document.getElementById("gameModLink").value.trim();
    const obb_link = document.getElementById("gameObbUrl").value.trim();
    const playStoreUrl = document.getElementById("gamePlayStoreUrl").value.trim();
    
    const scheduledTime = document.getElementById("gameScheduledTime")?.value || "";
    const now = new Date();
    
    let status = "published";
    if (scheduledTime) {
        const schedDate = new Date(scheduledTime);
        if (schedDate > now) {
            status = "scheduled";
        }
    }
    
    const screenshots = [
        document.getElementById("screenshot1")?.value.trim(),
        document.getElementById("screenshot2")?.value.trim(),
        document.getElementById("screenshot3")?.value.trim(),
        document.getElementById("screenshot4")?.value.trim()
    ].filter(Boolean);

    const featured = document.getElementById("gameFeatured")?.checked || false;
    const isSmallGame = document.getElementById("gameIsSmall")?.checked || false;
    const isHot = document.getElementById("gameIsHot")?.checked || false;
    const isNew = document.getElementById("gameIsNew")?.checked || false;
    const isUpdate = document.getElementById("gameIsUpdate")?.checked || false;

    if (!name || !platform) {
        alert("❌ Please fill in required fields.");
        return;
    }

    const gameData = {
        name,
        platform,
        type,
        version,
        size,
        icon,
        description,
        features,
        originalLink,
        modLink,
        downloadUrl: originalLink || modLink,
        obb_link,
        playStoreUrl,
        screenshots,
        featured,
        isSmallGame,
        isHot,
        isNew,
        isUpdate,
        status,
        scheduledTime,
        updatedAt: new Date().toISOString()
    };

    if (!id) {
        gameData.rating = 5.0;
        gameData.total_ratings = 0;
        gameData.createdAt = new Date().toISOString();
    }

    try {
        if (id) {
            const { error } = await supabase
                .from("games")
                .update(gameData)
                .eq("id", id);
            
            if (error) throw error;
            alert("✅ Updated successfully!");
        } else {
            const { error } = await supabase
                .from("games")
                .insert([gameData]);
            
            if (error) throw error;
            alert(status === "scheduled" ? "🕒 Game scheduled successfully!" : "✅ Added successfully!");
        }

        cancelForm();
        await loadGames();
    } catch (error) {
        console.error("Save Error:", error);
        alert("❌ Error saving: " + (error.message || JSON.stringify(error)));
    }
}

async function deleteGame(id) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
        const { error } = await supabase
            .from("games")
            .delete()
            .eq("id", id);

        if (error) throw error;
        alert("🗑️ Deleted successfully!");
        await loadGames();
    } catch (error) {
        console.error("Delete Error:", error);
        alert("❌ Could not delete item.");
    }
}

async function uploadJSONBatch() {
    const fileInput = document.getElementById("jsonBatchFile");
    if (!fileInput || !fileInput.files.length) {
        alert("❌ ကျေးဇူးပြု၍ JSON ဖိုင်ကို အရင်ရွေးချယ်ပါ။");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function(e) {
        try {
            const gamesArray = JSON.parse(e.target.result);
            if (!Array.isArray(gamesArray)) {
                alert("❌ ဖတ်ရှုရသော JSON ဖိုင်သည် Array ပုံစံ မဟုတ်ပါ။");
                return;
            }

            const formattedGames = gamesArray.map(game => {
                let features = game.features;
                if (typeof features === "string") {
                    features = features.split(",").map(i => i.trim()).filter(Boolean);
                } else if (!Array.isArray(features)) {
                    features = [];
                }

                const origUrl = game.originalLink || game.dataDownloadUrl || game.downloadUrl || "";
                const mUrl = game.modLink || game.wifiDownloadUrl || "";

                return {
                    name: game.name || "Unnamed",
                    platform: (game.platform || "android").toLowerCase(),
                    type: game.type || "Original",
                    version: game.version || "1.0.0",
                    size: game.size || "Unknown",
                    icon: game.icon || game.image || "",
                    description: game.description || "No description available.",
                    features: features,
                    originalLink: origUrl,
                    modLink: mUrl,
                    downloadUrl: origUrl || mUrl,
                    obb_link: game.obb_link || game.obbLink || "",
                    playStoreUrl: game.playStoreUrl || "",
                    screenshots: Array.isArray(game.screenshots) ? game.screenshots : [],
                    featured: game.featured === true || game.featured === "true",
                    isSmallGame: game.isSmallGame === true || game.isSmallGame === "true",
                    isHot: game.isHot === true || game.isHot === "true",
                    isNew: game.isNew === true || game.isNew === "true",
                    isUpdate: game.isUpdate === true || game.isUpdate === "true",
                    status: "published",
                    scheduledTime: "",
                    rating: 5.0,
                    total_ratings: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            });

            const { error } = await supabase
                .from("games")
                .insert(formattedGames);

            if (error) throw error;

            alert(`🎉 ဒေတာ ${gamesArray.length} ခုလုံး Supabase သို့ အောင်မြင်စွာ ဝင်ရောက်သွားပါပြီ သားရီး!`);
            fileInput.value = "";
            await loadGames();
        } catch (error) {
            console.error("JSON Batch Upload Error:", error);
            alert("❌ Error ဖြစ်သွားပါသည်: " + error.message);
        }
    };

    reader.readAsText(file);
}

window.exportGamesJSON = async function() {
    try {
        if (allGames.length === 0) {
            alert("❌ ထုတ်ယူရန် ဒေတာများ မရှိသေးပါ။");
            return;
        }

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allGames, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `akl_games_backup_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        alert(`✅ ဂိမ်းဒေတာ ${allGames.length} ခုလုံးကို JSON ဖိုင်အဖြစ် အောင်မြင်စွာ ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ!`);
    } catch (error) {
        console.error("Export Error:", error);
        alert("❌ ဒေတာထုတ်ယူရာတွင် အမှားအယွင်းရှိပါသည်: " + error.message);
    }
};

function isImageURL(value) {
    return typeof value === "string" && /^https?:\/\//i.test(value);
}

function escapeHTML(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

window.verifyAdminPassword = verifyAdminPassword;
window.adminLogout = adminLogout;
window.showAddForm = showAddForm;
window.editGame = editGame;
window.cancelForm = cancelForm;
window.saveGame = saveGame;
window.deleteGame = deleteGame;
window.uploadJSONBatch = uploadJSONBatch;
window.loadGames = loadGames;
