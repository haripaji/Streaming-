// ==========================================
// 0. SUPABASE CONNECTION (SAFE MODE)
// ==========================================
const supabaseUrl = 'https://maxalyasxiznqxmrzfzm.supabase.co';
const supabaseKey = 'sb_publishable_oWAYCI2tk-k3NyCJkXk9_g_9PB4SIlj';

let supabase = null;
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log("Supabase Connected Successfully! 🚀");
    } else {
        console.warn("Supabase library not found. Comments won't save.");
    }
} catch (error) {
    console.error("Supabase Connection Error:", error);
}

// ==========================================
// 1. VARIABLES 
// ==========================================
const animeGrid = document.getElementById('anime-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sectionTitle = document.getElementById('section-title');
const watchlistItems = document.getElementById('watchlist-items');

// Video Player Variables (Local Video Support Added)
const playerSection = document.getElementById('player-section');
const iframePlayer = document.getElementById('video-player');
const localPlayer = document.getElementById('local-video-player'); // Local Videos
const playerTitle = document.getElementById('player-title');
const closePlayerBtn = document.getElementById('close-player');

// Feedback Variables
const feedbackBtn = document.getElementById('feedback-btn');
const feedbackModal = document.getElementById('feedback-modal');
const closeFeedback = document.getElementById('close-feedback');
const feedbackForm = document.getElementById('feedback-form');

// Safe JSON parse helper and in-memory caches
const LIKES_KEY = 'animeLikes';
function safeParseJSON(value, fallback = null) {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch (e) {
        console.warn('Failed to parse JSON from localStorage key', e);
        return fallback;
    }
}

let likesCache = safeParseJSON(localStorage.getItem(LIKES_KEY), {}) || {};
let watchlist = safeParseJSON(localStorage.getItem('animeWatchlist'), []) || [];

// ==========================================
// 2. FETCH DATA & DISPLAY
// ==========================================
// Initial load
fetchAnime('https://api.jikan.moe/v4/top/anime');
displayWatchlist();

async function fetchAnime(url) {
    try {
        if (animeGrid) animeGrid.innerHTML = `<p class="loading">Loading anime content... ⏳</p>`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
        const resData = await response.json();
        displayAnime(resData.data);
    } catch (error) {
        console.error('fetchAnime error:', error);
        if (animeGrid) animeGrid.innerHTML = `<p class="loading" style="color:#ff4757;">Server is busy fetching anime. Try searching manually! 🔍</p>`;
    }
}

// कार्ड्स स्क्रीन पर दिखाने का सुरक्षित (Crash-Proof) फंक्शन
function displayAnime(animeList) {
    if (!animeGrid) return;
    animeGrid.innerHTML = '';
    if (!animeList || animeList.length === 0) {
        animeGrid.innerHTML = `<p class="loading">No anime found.</p>`;
        return;
    }

    animeList.forEach(anime => {
        const animeCard = document.createElement('div');
        animeCard.classList.add('anime-card');
        
        // Safer trailer/url and image extraction using optional chaining
        const trailerUrl = anime?.trailer?.embed_url || anime?.trailer?.url || '';
        const imageUrl = anime?.images?.jpg?.image_url || 'https://via.placeholder.com/200x280?text=No+Image';

        // 1. कार्ड का HTML स्ट्रक्चर (यहाँ से onclick हटा दिया गया है)
        animeCard.innerHTML = `
            <img src="${imageUrl}" alt="Anime Cover">
            <h4>${anime.title}</h4>
            <button class="play-btn">▶ Play Trailer</button>
            <button class="add-btn">＋ Add to List</button>
        `;

        // 2. सुरक्षित तरीके से बटन को काम पर लगाना (यही वेबसाइट को क्रैश होने से बचाता है)
        const playBtn = animeCard.querySelector('.play-btn');
        if (playBtn) playBtn.addEventListener('click', () => window.playVideo(trailerUrl, anime.title));

        const addBtn = animeCard.querySelector('.add-btn');
        if (addBtn) addBtn.addEventListener('click', () => window.addToWatchlist(anime.title));

        animeGrid.appendChild(animeCard);
    });
}


// ==========================================
// 3. SEARCH ENGINE FUNCTIONALITY
// ==========================================
if (searchBtn) searchBtn.addEventListener('click', performSearch);
if (searchInput) searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performSearch();
});

function performSearch() {
    const query = (searchInput && searchInput.value.trim()) || '';
    if (query !== '') {
        if (sectionTitle) sectionTitle.innerText = `🔍 Search Results for: "${query}"`;
        fetchAnime(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=20`);
    }
}

// ==========================================
// 4. WATCHLIST FUNCTIONALITY
// ==========================================
window.addToWatchlist = function(title) {
    // नया फिक्स: वॉचलिस्ट की लिमिट सेट करना
    if (!title) return;

    if (watchlist.length >= 100) {
        alert("Watchlist limit reached! Please remove some anime first.");
        return;
    }

    if (!watchlist.includes(title)) {
        watchlist.push(title);
        localStorage.setItem('animeWatchlist', JSON.stringify(watchlist));
        displayWatchlist();
        alert(`"${title}" added to your watchlist!`);
    } else {
        alert("This anime is already in your watchlist!");
    }
}

window.removeFromWatchlist = function(index) {
    if (typeof index !== 'number' || index < 0 || index >= watchlist.length) return;
    watchlist.splice(index, 1);
    localStorage.setItem('animeWatchlist', JSON.stringify(watchlist));
    displayWatchlist();
}

function displayWatchlist() {
    if (!watchlistItems) return;
    watchlistItems.innerHTML = '';
    if (watchlist.length === 0) {
        watchlistItems.innerHTML = `<p class="empty-msg">Your watchlist is empty.</p>`;
        return;
    }

    watchlist.forEach((animeTitle, index) => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = animeTitle;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.type = 'button';
        removeBtn.textContent = '❌';
        removeBtn.addEventListener('click', () => window.removeFromWatchlist(index));

        li.appendChild(span);
        li.appendChild(removeBtn);
        watchlistItems.appendChild(li);
    });
}

// ==========================================
// 5. VIDEO PLAYER (WITH LOCAL VIDEO SUPPORT)
// ==========================================
const likeBtn = document.getElementById('like-btn');
const commentBtn = document.getElementById('comment-btn');
const commentSection = document.getElementById('comment-section');
const commentInput = document.getElementById('comment-input');
const submitComment = document.getElementById('submit-comment');
const commentList = document.getElementById('comment-list');
const shareBtn = document.getElementById('share-btn');
const downloadBtn = document.getElementById('download-btn');

let currentVideoTitle = "";
let currentVideoUrl = "";

window.playVideo = function(url, title) {
    const safeUrl = (typeof url === 'string') ? url : '';
    if (!safeUrl) {
        alert("Sorry! No video available for this.");
        return;
    }
    
    currentVideoTitle = title || "";
    currentVideoUrl = safeUrl;
    if (playerTitle) playerTitle.innerText = `Playing: ${currentVideoTitle}`;

    // store a stable reference on the player section (avoids relying on loose globals elsewhere)
    if (playerSection) playerSection.dataset.videoTitle = currentVideoTitle;
    
    // Check if video is local (.mp4/.webm) or iframe (YouTube/API)
    const isLocal = safeUrl.includes('.mp4') || safeUrl.includes('.webm');
    if (isLocal && localPlayer) {
        if (iframePlayer) iframePlayer.style.display = 'none';
        localPlayer.style.display = 'block';
        localPlayer.src = safeUrl;
        localPlayer.play().catch(err => console.error("Playback error:", err)); 
    } else if (iframePlayer) {
        if (localPlayer) { localPlayer.style.display = 'none'; try { localPlayer.pause(); } catch(e){} }
        iframePlayer.style.display = 'block';
        iframePlayer.src = safeUrl;
    }

    if (playerSection) playerSection.style.display = 'block'; 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
    
    checkLikeStatus(currentVideoTitle);
    loadComments(currentVideoTitle);
    if (commentSection) commentSection.style.display = 'none';
}

if (closePlayerBtn) {
    closePlayerBtn.addEventListener('click', () => {
        if (playerSection) playerSection.style.display = 'none';
        if (iframePlayer) iframePlayer.src = ''; 
        if (localPlayer) { try { localPlayer.pause(); } catch(e){} localPlayer.src = ''; }
    });
}

// --- LIKE, SHARE, DOWNLOAD ---
// Helper functions for likes (in-memory cache + localStorage save)
function saveLikes() {
    try {
        localStorage.setItem(LIKES_KEY, JSON.stringify(likesCache));
    } catch (e) {
        console.error('Failed to save likes to localStorage', e);
    }
}

function isLiked(title) {
    if (!title) return false;
    return !!likesCache[title];
}

function setLikeStateOnButton(title) {
    if (!likeBtn) return;
    const liked = isLiked(title);
    likeBtn.classList.toggle('liked', liked);
    likeBtn.setAttribute('aria-pressed', liked ? 'true' : 'false');

    // Ensure we update only a label span to avoid duplicate ids and heavy innerHTML changes
    let label = likeBtn.querySelector('.like-label');
    if (!label) {
        // create a lightweight label element once
        label = document.createElement('span');
        label.className = 'like-label';
        likeBtn.appendChild(label);
    }

    // emoji + label text
    likeBtn.childNodes.forEach(node => { if (node.nodeType === Node.TEXT_NODE) node.textContent = ''; });
    likeBtn.insertBefore(document.createTextNode(liked ? '❤️ ' : '🤍 '), likeBtn.firstChild);
    label.textContent = liked ? 'Liked' : 'Like';
}

if (likeBtn) {
    // Ensure accessible default markup (won't overwrite if HTML already provides it)
    if (!likeBtn.querySelector('.like-label')) {
        likeBtn.innerHTML = `${likeBtn.textContent.trim() ? likeBtn.textContent.trim() + ' ' : ''}<span class="like-label">Like</span>`;
    }

    likeBtn.addEventListener('click', () => {
        const title = (playerSection && playerSection.dataset.videoTitle) || currentVideoTitle || '';
        if (!title) return;

        if (isLiked(title)) {
            delete likesCache[title];
        } else {
            likesCache[title] = true;
        }
        saveLikes();
        setLikeStateOnButton(title);
    });
}

function checkLikeStatus(title) {
    // Delegates to the central updater which uses the cache
    setLikeStateOnButton(title);
}

if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
        try {
            if (navigator.share) {
                await navigator.share({ title: currentVideoTitle, text: `Watch ${currentVideoTitle}`, url: window.location.href });
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(window.location.href);
                alert("Link copied!");
            } else {
                alert("Share not supported on this device.");
            }
        } catch (err) { console.error('share error', err); }
    });
}

if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
        try {
            if (navigator.clipboard) await navigator.clipboard.writeText(currentVideoUrl);
            alert(`Link copied: ${currentVideoUrl}\nPaste it in any downloader!`);
        } catch(e) { console.error('download copy failed', e); alert('Failed to copy link'); }
    });
}

// ==========================================
// 6. SUPABASE LIVE COMMENTS LOGIC
// ==========================================
if (commentBtn) {
    commentBtn.addEventListener('click', () => {
        if (!commentSection) return;
        commentSection.style.display = commentSection.style.display === 'none' ? 'block' : 'none';
    });
}

if (submitComment) {
    submitComment.addEventListener('click', async () => {
        const text = (commentInput && commentInput.value.trim()) || "";
        if (text !== "" && supabase) {
            submitComment.textContent = "Posting... ⏳";
            submitComment.disabled = true;

            try {
                const { data, error } = await supabase.from('anime_comments').insert([ { video_title: currentVideoTitle, comment_text: text } ]);
                if (error) {
                    console.error('Supabase insert error:', error);
                    alert("Failed to post comment.");
                } else {
                    if (commentInput) commentInput.value = "";
                    loadComments(currentVideoTitle);
                }
            } catch (err) {
                console.error('submitComment error:', err);
                alert('Failed to post comment.');
            }

            submitComment.textContent = "Post";
            submitComment.disabled = false;
        } else if (!supabase) {
            alert("Database not connected!");
        }
    });
}

async function loadComments(title) {
    if (!commentList) return;
    commentList.innerHTML = `<li style="text-align:center; color:#868686;">Loading live comments... ⏳</li>`;
    
    if (!supabase) {
        commentList.innerHTML = `<li style="text-align:center; color:red;">Database Error</li>`;
        return;
    }

    try {
        const { data, error } = await supabase.from('anime_comments').select('*').eq('video_title', title).order('created_at', { ascending: false });

        commentList.innerHTML = "";
        if (error || !data || data.length === 0) {
            commentList.innerHTML = `<li style="text-align:center; color:#868686;">No comments yet. Be the first!</li>`;
            return;
        }
        
        data.forEach(row => {
            let li = document.createElement('li');
            li.innerHTML = `<strong>Guest:</strong> ${row.comment_text}`;
            commentList.appendChild(li);
        });
    } catch (err) {
        console.error('loadComments error:', err);
        commentList.innerHTML = `<li style="text-align:center; color:red;">Failed to load comments</li>`;
    }
}

// ==========================================
// 7. GOOGLE SHEETS FEEDBACK & MOBILE SLIDER
// ==========================================
if (feedbackBtn) feedbackBtn.addEventListener('click', () => { if (feedbackModal) feedbackModal.style.display = 'block'; });
if (closeFeedback) closeFeedback.addEventListener('click', () => { if (feedbackModal) feedbackModal.style.display = 'none'; });
window.addEventListener('click', (e) => { if (e.target === feedbackModal) feedbackModal.style.display = 'none'; });

if (feedbackForm) {
    feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const submitBtn = feedbackForm.querySelector('.submit-btn');
        if (!submitBtn) return;
        submitBtn.innerText = "Sending... ⏳";
        submitBtn.disabled = true;
        const scriptURL = 'https://script.google.com/macros/s/18VVfeDCnfWN6lxq62R8s4zkc7NgfrXHMsPYpxs_mffJuqCbq0jXgHufs/exec';

        fetch(scriptURL, { method: 'POST', mode: 'no-cors', body: new FormData(feedbackForm) })
        .then(() => {
            alert("Feedback sent successfully! ❤️");
            feedbackForm.reset(); if (feedbackModal) feedbackModal.style.display = 'none'; 
            submitBtn.innerText = "Send Message 🚀"; submitBtn.disabled = false;
        }).catch(err => {
            console.error('Feedback send error:', err);
            alert('Failed to send feedback');
            submitBtn.innerText = "Send Message 🚀"; submitBtn.disabled = false;
        });
    });
}

const toggleWatchlistBtn = document.getElementById('toggle-watchlist');
const watchlistSidebar = document.querySelector('.watchlist-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');

if (toggleWatchlistBtn && watchlistSidebar) {
    toggleWatchlistBtn.addEventListener('click', () => {
        watchlistSidebar.classList.toggle('active');
        toggleWatchlistBtn.innerText = watchlistSidebar.classList.contains('active') ? "✖ Close List" : "⭐ Watchlist";
    });
}
if (closeSidebarBtn && watchlistSidebar) {
    closeSidebarBtn.addEventListener('click', () => {
        watchlistSidebar.classList.remove('active');
        if (toggleWatchlistBtn) toggleWatchlistBtn.innerText = "⭐ Watchlist";
    });
}
