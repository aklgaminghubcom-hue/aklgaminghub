import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, doc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCMA0Nd6JajRZ2b-OIDPQY2MYSQ67TV2dk",
    authDomain: "akl-gaming-hub-new.firebaseapp.com",
    projectId: "akl-gaming-hub-new",
    storageBucket: "akl-gaming-hub-new.firebasestorage.app",
    messagingSenderId: "6685455502",
    appId: "1:6685455502:web:fc6cb049a8503f7e46c5df"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateGames() {
    try {
        const response = await fetch('games.json');
        const data = await response.json();
        
        let games = [];
        if (Array.isArray(data)) {
            games = data;
        } else if (data.games && Array.isArray(data.games)) {
            games = data.games;
        }

        console.log(`စုစုပေါင်း ဂိမ်းရေ: ${games.length}`);

        // Firestore batch limit မှာ တစ်ကြိမ်လျှင် အများဆုံး ၅၀၀ ဖြစ်သောကြောင့် 
        // ဂိမ်း ၅၀၀ ထက်ကျော်ပါက အစုလိုက် (chunks) ခွဲ၍ တင်ရပါမည်။
        const CHUNK_SIZE = 450;
        
        for (let i = 0; i < games.length; i += CHUNK_SIZE) {
            const chunk = games.slice(i, i + CHUNK_SIZE);
            const batch = writeBatch(db);

            chunk.forEach((game, index) => {
                const actualIndex = i + index;
                const cleanName = game.name ? game.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : `game_${actualIndex}`;
                const gameId = `game_${actualIndex + 1}_${cleanName}`;
                const gameRef = doc(db, "games", gameId);
                
                batch.set(gameRef, {
                    name: game.name || "",
                    platform: game.platform || "android",
                    type: game.type || "Original",
                    version: game.version || "1.0",
                    size: game.size || "Unknown",
                    icon: game.icon || game.image || "",
                    description: game.description || "",
                    downloadUrl: game.downloadUrl || game.downloadurl || "",
                    obb_link: game.obb_link || game.obbLink || "",
                    playStoreUrl: game.playStoreUrl || game.playstoreurl || "",
                    features: game.features || [],
                    screenshots: game.screenshots || [],
                    featured: game.featured || false,
                    updatedAt: Date.now()
                });
            });

            await batch.commit();
            console.log(`Batch ${i / CHUNK_SIZE + 1} တင်ပြီးပါပြီ (${chunk.length} ခု)`);
        }

        alert(`🎉 ဂိမ်း ${games.length} ခု လုံး Project အသစ် (akl-gaming-hub-new) သို့ အမှန်အတိုင်း အပြည့်အစုံ ဝင်သွားပါပြီ သားရီး!`);
        location.reload();
    } catch (error) {
        console.error("Migration Error:", error);
        alert("❌ Error ဖြစ်သွားပါသည်: " + error.message);
    }
}

window.migrateGames = migrateGames;
