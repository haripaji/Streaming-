// ==========================================
// 0. SUPABASE CONNECTION (SAFE MODE)
// ==========================================
const supabaseUrl = 'https://maxalyasxiznqxmrzfzm.supabase.co';
const supabaseKey = 'sb_publishable_oWAYCI2tk-k3NyCJkXk9_g_9PB4SIlj';
let supabase = null;
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log("Supabase Connected 🚀");
    }
} catch (error) { console.error("Supabase Error:", error); }

// ==========================================
// 1. VARIABLES
// ==========================================
const animeGrid = document.getElementById('anime-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sectionTitle = document.getElementById('section-title');
const watchlistItems = document.getElementById('watchlist-items');

const playerSection = document.getElementById('player-section');
const iframePlayer = document.getElementById('video-player');
const localPlayer = document.getElementById('local-video-player');
const playerTitle = document.getElementById('player-title');
const closePlayerBtn = document.getElementById('close-player');

let watchlist = JSON.parse(localStorage.getItem('animeWatchlist')) || [];

// ==========================================
// 2. FETCH DATA (Direct Call to avoid DOM load bug)
// ==========================================
fetchAnime('https://api.jikan.moe/v4/top/anime');
displayWatchlist();

async function fetchAnime(url) {
    try {
        animeGrid.innerHTML = `<p class="loading">Loading anime content... ⏳</p>`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("API Busy");
        const resData = await response.json();
        displayAnime(resData.data);
    } catch (error) {
        animeGrid.innerHTML = `<p class="loading" style="color:#ff4757;">Server is busy. Try searching manually! 🔍</p>`;
    }
}

// CRASH-PROOF Display Function
function displayAnime(animeList) {
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
            <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
            <h4>${anime.title}</h4>
            <button class="play-btn">▶ Play Trailer</button>
            <button class="add-btn">＋ Add to List</button>
        `;
        // Safe Event Listeners
        card.querySelector('.play-btn').addEventListener('click', () => playVideo(trailerUrl, anime.title));
        card.querySelector('.add-btn').addEventListener('click', () => addToWatchlist(anime.title));
        animeGrid.appendChild(card);
    });
}

// ==========================================
// 3. SEARCH & WATCHLIST LOGIC
// ==========================================
searchBtn.addEventListener('click', () => {
    const q = searchInput.value.trim();
    if (q) { sectionTitle.innerText = `🔍 Search: "${q}"`; fetchAnime(`https://api.jikan.moe/v4/anime?q=${q}&limit=20`); }
});

window.addToWatchlist = function(title) {
    if (watchlist.length >= 100) return alert("Watchlist full! Remove some anime first.");
    if (!watchlist.includes(title)) {
        watchlist.push(title);
        localStorage.setItem('animeWatchlist', JSON.stringify(watchlist));
        displayWatchlist();
        alert(`"${title}" added!`);
    } else { alert("Already in watchlist!"); }
}

window.removeFromWatchlist = function(index) {
    watchlist.splice(index, 1);
    localStorage.setItem('animeWatchlist', JSON.stringify(watchlist));
    displayWatchlist();
}

function displayWatchlist() {
    watchlistItems.innerHTML = watchlist.length ? '' : `<li class="empty-msg">List is empty.</li>`;
    watchlist.forEach((title, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${title}</span> <button class="remove-btn" onclick="removeFromWatchlist(${i})">❌</button>`;
        watchlistItems.appendChild(li);
    });
}

// ==========================================
// 4. SMART VIDEO PLAYER
// ==========================================
let currentTitle = "", currentUrl = "";

window.playVideo = function(url, title) {
    if (url === 'null') return alert("No video available.");
    currentTitle = title; currentUrl = url;
    playerTitle.innerText = `Playing: ${title}`;

    if(url.includes('.mp4') || url.includes('.webm')) {
        iframePlayer.style.display = 'none'; iframePlayer.src = '';
        localPlayer.style.display = 'block'; localPlayer.src = url;
        localPlayer.play().catch(e => console.log("Play error:", e));
    } else {
        localPlayer.style.display = 'none'; localPlayer.pause();
        iframePlayer.style.display = 'block'; iframePlayer.src = url;
    }

    playerSection.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    checkLikeStatus(title); loadComments(title);
    document.getElementById('comment-section').style.display = 'none';
}

closePlayerBtn.addEventListener('click', () => {
    playerSection.style.display = 'none';
    iframePlayer.src = ''; localPlayer.pause();
});

// ==========================================
// 5. LIKES & BUTTONS
// ==========================================
const likeBtn = document.getElementById('like-btn');
likeBtn.addEventListener('click', () => {
    let likes = JSON.parse(localStorage.getItem('animeLikes')) || {};
    if (likes[currentTitle]) { delete likes[currentTitle]; likeBtn.classList.remove('liked'); likeBtn.innerHTML = `🤍 Like`; }
    else { likes[currentTitle] = true; likeBtn.classList.add('liked'); likeBtn.innerHTML = `❤️ Liked`; }
    localStorage.setItem('animeLikes', JSON.stringify(likes));
});

function checkLikeStatus(title) {
    let likes = JSON.parse(localStorage.getItem('animeLikes')) || {};
    if (likes[title]) { likeBtn.classList.add('liked'); likeBtn.innerHTML = `❤️ Liked`; }
    else { likeBtn.classList.remove('liked'); likeBtn.innerHTML = `🤍 Like`; }
}

document.getElementById('download-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(currentUrl); alert(`Link copied: ${currentUrl}`);
});
document.getElementById('share-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href); alert("Website Link copied!");
});

// ==========================================
// 6. SUPABASE COMMENTS
// ==========================================
document.getElementById('comment-btn').addEventListener('click', () => {
    const sec = document.getElementById('comment-section');
    sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('submit-comment').addEventListener('click', async () => {
    const text = document.getElementById('comment-input').value.trim();
    const btn = document.getElementById('submit-comment');
    if (text && supabase) {
        btn.innerText = "⏳"; btn.disabled = true;
        const { error } = await supabase.from('anime_comments').insert([{ video_title: currentTitle, comment_text: text }]);
        if (!error) { document.getElementById('comment-input').value = ""; loadComments(currentTitle); }
        btn.innerText = "Post"; btn.disabled = false;
    }
});

async function loadComments(title) {
    const list = document.getElementById('comment-list');
    if (!supabase) return list.innerHTML = `<li>DB Offline</li>`;
    list.innerHTML = `<li>Loading...</li>`;
    const { data } = await supabase.from('anime_comments').select('*').eq('video_title', title).order('created_at', { ascending: false });
    list.innerHTML = data && data.length ? data.map(r => `<li><strong>Guest:</strong> ${r.comment_text}</li>`).join('') : `<li>No comments yet.</li>`;
}

// ==========================================
// 7. SIDEBAR & MODAL LOGIC
// ==========================================
document.getElementById('toggle-watchlist').addEventListener('click', () => document.getElementById('watchlist-sidebar').classList.add('active'));
document.getElementById('close-sidebar-btn').addEventListener('click', () => document.getElementById('watchlist-sidebar').classList.remove('active'));

document.getElementById('feedback-btn').addEventListener('click', () => document.getElementById('feedback-modal').style.display = 'flex');
document.getElementById('close-feedback').addEventListener('click', () => document.getElementById('feedback-modal').style.display = 'none');

document.getElementById('feedback-form').addEventListener('submit', (e) => {
    e.preventDefault(); alert("Feedback sent! ❤️"); 
    document.getElementById('feedback-modal').style.display = 'none';
});
