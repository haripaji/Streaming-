// ==========================================
// 0. SUPABASE SAFE CONNECTION
// ==========================================
const supabaseUrl = 'https://maxalyasxiznqxmrzfzm.supabase.co';
const supabaseKey = 'sb_publishable_oWAYCI2tk-k3NyCJkXk9_g_9PB4SIlj';
let supabase = null;
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log("Supabase Connected 🚀");
    }
} catch (error) { console.log("Supabase Error:", error); }

// ==========================================
// 1. SAFE VARIABLES & LOCAL STORAGE
// ==========================================
let watchlist = [];
try { 
    // अगर पुराना डेटा करप्ट हो गया है, तो यह क्रैश होने से बचाएगा
    let savedData = localStorage.getItem('animeWatchlist');
    if(savedData) watchlist = JSON.parse(savedData);
} catch(e) { 
    console.log("Storage reset"); 
    localStorage.removeItem('animeWatchlist'); 
}

const animeGrid = document.getElementById('anime-grid');
const sectionTitle = document.getElementById('section-title');
const watchlistItems = document.getElementById('watchlist-items');
const iframePlayer = document.getElementById('video-player');
const localPlayer = document.getElementById('local-video-player');
const playerSection = document.getElementById('player-section');
const playerTitle = document.getElementById('player-title');

// ==========================================
// 2. FETCH DATA SAFELY
// ==========================================
if(animeGrid) {
    fetchAnime('https://api.jikan.moe/v4/top/anime');
    displayWatchlist();
}

async function fetchAnime(url) {
    try {
        if(animeGrid) animeGrid.innerHTML = `<p class="loading">Loading anime content... ⏳</p>`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("API Busy");
        const resData = await response.json();
        displayAnime(resData.data);
    } catch (error) {
        if(animeGrid) animeGrid.innerHTML = `<p class="loading" style="color:#ff4757;">Server is busy. Try searching manually! 🔍</p>`;
    }
}

function displayAnime(animeList) {
    if(!animeGrid) return;
    animeGrid.innerHTML = '';
    if (!animeList || animeList.length === 0) {
        animeGrid.innerHTML = `<p class="loading">No anime found.</p>`;
        return;
    }
    animeList.forEach(anime => {
        const card = document.createElement('div');
        card.classList.add('anime-card');
        const trailerUrl = anime.trailer && anime.trailer.embed_url ? anime.trailer.embed_url : 'null';

        card.innerHTML = `
            <img src="${anime.images.jpg.image_url}" alt="Cover">
            <h4>${anime.title}</h4>
            <button class="play-btn">▶ Play Trailer</button>
            <button class="add-btn">＋ Add to List</button>
        `;
        // Safe Event Listeners (?. क्रैश होने से बचाएगा)
        card.querySelector('.play-btn')?.addEventListener('click', () => playVideo(trailerUrl, anime.title));
        card.querySelector('.add-btn')?.addEventListener('click', () => addToWatchlist(anime.title));
        animeGrid.appendChild(card);
    });
}

// ==========================================
// 3. SAFE EVENT LISTENERS (Anti-Crash Logic)
// ==========================================
document.getElementById('search-btn')?.addEventListener('click', () => {
    const q = document.getElementById('search-input')?.value.trim();
    if (q && sectionTitle) { 
        sectionTitle.innerText = `🔍 Search: "${q}"`; 
        fetchAnime(`https://api.jikan.moe/v4/anime?q=${q}&limit=20`); 
    }
});

window.addToWatchlist = function(title) {
    if (watchlist.length >= 100) return alert("Watchlist full!");
    if (!watchlist.includes(title)) {
        watchlist.push(title);
        localStorage.setItem('animeWatchlist', JSON.stringify(watchlist));
        displayWatchlist();
        alert(`"${title}" added!`);
    } else { alert("Already in list!"); }
}

window.removeFromWatchlist = function(index) {
    watchlist.splice(index, 1);
    localStorage.setItem('animeWatchlist', JSON.stringify(watchlist));
    displayWatchlist();
}

function displayWatchlist() {
    if(!watchlistItems) return;
    watchlistItems.innerHTML = watchlist.length ? '' : `<li class="empty-msg">List is empty.</li>`;
    watchlist.forEach((title, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${title}</span> <button class="remove-btn" onclick="removeFromWatchlist(${i})">❌</button>`;
        watchlistItems.appendChild(li);
    });
}

// ==========================================
// 4. PLAYER LOGIC
// ==========================================
let currentTitle = "", currentUrl = "";
window.playVideo = function(url, title) {
    if (url === 'null') return alert("No video available.");
    currentTitle = title; currentUrl = url;
    if(playerTitle) playerTitle.innerText = `Playing: ${title}`;

    if((url.includes('.mp4') || url.includes('.webm')) && localPlayer) {
        if(iframePlayer) { iframePlayer.style.display = 'none'; iframePlayer.src = ''; }
        localPlayer.style.display = 'block'; localPlayer.src = url;
        localPlayer.play().catch(e => console.log("Play error:", e));
    } else if (iframePlayer) {
        if(localPlayer) { localPlayer.style.display = 'none'; localPlayer.pause(); }
        iframePlayer.style.display = 'block'; iframePlayer.src = url;
    }

    if(playerSection) {
        playerSection.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    checkLikeStatus(title); loadComments(title);
    const cs = document.getElementById('comment-section');
    if(cs) cs.style.display = 'none';
}

document.getElementById('close-player')?.addEventListener('click', () => {
    if(playerSection) playerSection.style.display = 'none';
    if(iframePlayer) iframePlayer.src = ''; 
    if(localPlayer) localPlayer.pause();
});

// ==========================================
// 5. LIKES BUTTON
// ==========================================
const likeBtn = document.getElementById('like-btn');
likeBtn?.addEventListener('click', () => {
    let likes = {};
    try { likes = JSON.parse(localStorage.getItem('animeLikes')) || {}; } catch(e){}
    if (likes[currentTitle]) { delete likes[currentTitle]; likeBtn.classList.remove('liked'); likeBtn.innerHTML = `🤍 Like`; }
    else { likes[currentTitle] = true; likeBtn.classList.add('liked'); likeBtn.innerHTML = `❤️ Liked`; }
    localStorage.setItem('animeLikes', JSON.stringify(likes));
});

function checkLikeStatus(title) {
    if(!likeBtn) return;
    let likes = {};
    try { likes = JSON.parse(localStorage.getItem('animeLikes')) || {}; } catch(e){}
    if (likes[title]) { likeBtn.classList.add('liked'); likeBtn.innerHTML = `❤️ Liked`; }
    else { likeBtn.classList.remove('liked'); likeBtn.innerHTML = `🤍 Like`; }
}

document.getElementById('download-btn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(currentUrl); alert(`Link copied: ${currentUrl}`);
});
document.getElementById('share-btn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href); alert("Website Link copied!");
});

// ==========================================
// 6. SUPABASE COMMENTS
// ==========================================
document.getElementById('comment-btn')?.addEventListener('click', () => {
    const sec = document.getElementById('comment-section');
    if(sec) sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('submit-comment')?.addEventListener('click', async () => {
    const input = document.getElementById('comment-input');
    const btn = document.getElementById('submit-comment');
    if(!input || !btn) return;
    const text = input.value.trim();
    
    if (text && supabase) {
        btn.innerText = "⏳"; btn.disabled = true;
        const { error } = await supabase.from('anime_comments').insert([{ video_title: currentTitle, comment_text: text }]);
        if (!error) { input.value = ""; loadComments(currentTitle); }
        btn.innerText = "Post"; btn.disabled = false;
    }
});

async function loadComments(title) {
    const list = document.getElementById('comment-list');
    if(!list) return;
    if (!supabase) return list.innerHTML = `<li>DB Offline</li>`;
    list.innerHTML = `<li>Loading...</li>`;
    try {
        const { data } = await supabase.from('anime_comments').select('*').eq('video_title', title).order('created_at', { ascending: false });
        list.innerHTML = data && data.length ? data.map(r => `<li><strong>Guest:</strong> ${r.comment_text}</li>`).join('') : `<li>No comments yet.</li>`;
    } catch(e) { list.innerHTML = `<li>Error loading comments</li>`; }
}

// ==========================================
// 7. SIDEBAR & MODAL
// ==========================================
document.getElementById('toggle-watchlist')?.addEventListener('click', () => {
    document.getElementById('watchlist-sidebar')?.classList.add('active');
});
document.getElementById('close-sidebar-btn')?.addEventListener('click', () => {
    document.getElementById('watchlist-sidebar')?.classList.remove('active');
});

document.getElementById('feedback-btn')?.addEventListener('click', () => {
    const mod = document.getElementById('feedback-modal');
    if(mod) mod.style.display = 'flex';
});
document.getElementById('close-feedback')?.addEventListener('click', () => {
    const mod = document.getElementById('feedback-modal');
    if(mod) mod.style.display = 'none';
});

document.getElementById('feedback-form')?.addEventListener('submit', (e) => {
    e.preventDefault(); 
    alert("Feedback sent! ❤️"); 
    const mod = document.getElementById('feedback-modal');
    if(mod) mod.style.display = 'none';
});
