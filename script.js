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

let watchlist = JSON.parse(localStorage.getItem('animeWatchlist')) || [];

// ==========================================
// 2. FETCH DATA & DISPLAY
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    fetchAnime('https://api.jikan.moe/v4/top/anime');
    displayWatchlist();
});

async function fetchAnime(url) {
    try {
        animeGrid.innerHTML = `<p class="loading">Loading anime content... ⏳</p>`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("API Limit Reached");
        const resData = await response.json();
        displayAnime(resData.data);
    } catch (error) {
        animeGrid.innerHTML = `<p class="loading" style="color:#ff4757;">Server is busy fetching anime. Try searching manually! 🔍</p>`;
    }
}

// कार्ड्स स्क्रीन पर दिखाने का सुरक्षित (Crash-Proof) फंक्शन
function displayAnime(animeList) {
    animeGrid.innerHTML = '';
    if (!animeList || animeList.length === 0) {
        animeGrid.innerHTML = `<p class="loading">No anime found.</p>`;
        return;
    }

    animeList.forEach(anime => {
        const animeCard = document.createElement('div');
        animeCard.classList.add('anime-card');
        
        const trailerUrl = anime.trailer && anime.trailer.embed_url ? anime.trailer.embed_url : 'null';

        // 1. कार्ड का HTML स्ट्रक्चर (यहाँ से onclick हटा दिया गया है)
        animeCard.innerHTML = `
            <img src="${anime.images.jpg.image_url}" alt="Anime Cover">
            <h4>${anime.title}</h4>
            <button class="play-btn">▶ Play Trailer</button>
            <button class="add-btn">＋ Add to List</button>
        `;

        // 2. सुरक्षित तरीके से बटन को काम पर लगाना (यही वेबसाइट को क्रैश होने से बचाएगा)
        const playBtn = animeCard.querySelector('.play-btn');
        playBtn.addEventListener('click', () => playVideo(trailerUrl, anime.title));

        const addBtn = animeCard.querySelector('.add-btn');
        addBtn.addEventListener('click', () => addToWatchlist(anime.title));

        animeGrid.appendChild(animeCard);
    });
}


// ==========================================
// 3. SEARCH ENGINE FUNCTIONALITY
// ==========================================
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

function performSearch() {
    const query = searchInput.value.trim();
    if (query !== '') {
        sectionTitle.innerText = `🔍 Search Results for: "${query}"`;
        fetchAnime(`https://api.jikan.moe/v4/anime?q=${query}&limit=20`);
    }
}

// ==========================================
// 4. WATCHLIST FUNCTIONALITY
// ==========================================
window.addToWatchlist = function(title) {
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
    watchlist.splice(index, 1);
    localStorage.setItem('animeWatchlist', JSON.stringify(watchlist));
    displayWatchlist();
}

function displayWatchlist() {
    watchlistItems.innerHTML = '';
    if (watchlist.length === 0) {
        watchlistItems.innerHTML = `<p class="empty-msg">Your watchlist is empty.</p>`;
        return;
    }

    watchlist.forEach((animeTitle, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${animeTitle}</span>
            <button class="remove-btn" onclick="removeFromWatchlist(${index})">❌</button>
        `;
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
    if (url === 'null' || url === '') {
        alert("Sorry! No video available for this.");
        return;
    }
    
    currentVideoTitle = title;
    currentVideoUrl = url;
    playerTitle.innerText = `Playing: ${title}`;
    
    // Check if video is local (.mp4) or YouTube/API (iframe)
    if((url.includes('.mp4') || url.includes('.webm')) && localPlayer) {
        if(iframePlayer) iframePlayer.style.display = 'none';
        localPlayer.style.display = 'block';
        localPlayer.src = url;
        localPlayer.play();
    } else if (iframePlayer) {
        if(localPlayer) { localPlayer.style.display = 'none'; localPlayer.pause(); }
        iframePlayer.style.display = 'block';
        iframePlayer.src = url;
    }

    playerSection.style.display = 'block'; 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
    
    checkLikeStatus(title);
    loadComments(title);
    if(commentSection) commentSection.style.display = 'none';
}

if (closePlayerBtn) {
    closePlayerBtn.addEventListener('click', () => {
        playerSection.style.display = 'none';
        if(iframePlayer) iframePlayer.src = ''; 
        if(localPlayer) { localPlayer.pause(); localPlayer.src = ''; }
    });
}

// --- LIKE, SHARE, DOWNLOAD ---
if (likeBtn) {
    likeBtn.addEventListener('click', () => {
        let likesData = JSON.parse(localStorage.getItem('animeLikes')) || {};
        if (likesData[currentVideoTitle]) {
            delete likesData[currentVideoTitle];
            likeBtn.classList.remove('liked');
            likeBtn.innerHTML = `🤍 <span id="like-text">Like</span>`;
        } else {
            likesData[currentVideoTitle] = true;
            likeBtn.classList.add('liked');
            likeBtn.innerHTML = `❤️ <span id="like-text">Liked</span>`;
        }
        localStorage.setItem('animeLikes', JSON.stringify(likesData));
    });
}

function checkLikeStatus(title) {
    if(!likeBtn) return;
    let likesData = JSON.parse(localStorage.getItem('animeLikes')) || {};
    if (likesData[title]) {
        likeBtn.classList.add('liked');
        likeBtn.innerHTML = `❤️ <span id="like-text">Liked</span>`;
    } else {
        likeBtn.classList.remove('liked');
        likeBtn.innerHTML = `🤍 <span id="like-text">Like</span>`;
    }
}

if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
        try {
            if (navigator.share) {
                await navigator.share({ title: currentVideoTitle, text: `Watch ${currentVideoTitle}`, url: window.location.href });
            } else {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied!");
            }
        } catch (err) {}
    });
}

if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(currentVideoUrl);
        alert(`Link copied: ${currentVideoUrl}\nPaste it in any downloader!`);
    });
}

// ==========================================
// 6. SUPABASE LIVE COMMENTS LOGIC
// ==========================================
if (commentBtn) {
    commentBtn.addEventListener('click', () => {
        commentSection.style.display = commentSection.style.display === 'none' ? 'block' : 'none';
    });
}

if (submitComment) {
    submitComment.addEventListener('click', async () => {
        const text = commentInput.value.trim();
        if (text !== "" && supabase) {
            submitComment.innerText = "Posting... ⏳";
            submitComment.disabled = true;

            const { data, error } = await supabase.from('anime_comments').insert([ { video_title: currentVideoTitle, comment_text: text } ]);

            if (error) {
                alert("Failed to post comment.");
            } else {
                commentInput.value = "";
                loadComments(currentVideoTitle);
            }
            submitComment.innerText = "Post";
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
}

// ==========================================
// 7. GOOGLE SHEETS FEEDBACK & MOBILE SLIDER
// ==========================================
if (feedbackBtn) feedbackBtn.addEventListener('click', () => feedbackModal.style.display = 'block');
if (closeFeedback) closeFeedback.addEventListener('click', () => feedbackModal.style.display = 'none');
window.addEventListener('click', (e) => { if (e.target === feedbackModal) feedbackModal.style.display = 'none'; });

if (feedbackForm) {
    feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const submitBtn = feedbackForm.querySelector('.submit-btn');
        submitBtn.innerText = "Sending... ⏳";
        submitBtn.disabled = true;
        const scriptURL = 'https://script.google.com/macros/s/18VVfeDCnfWN6lxq62R8s4zkc7NgfrXHMsPYpxs_mffJuqCbq0jXgHufs/exec';

        fetch(scriptURL, { method: 'POST', mode: 'no-cors', body: new FormData(feedbackForm) })
        .then(() => {
            alert("Feedback sent successfully! ❤️");
            feedbackForm.reset(); feedbackModal.style.display = 'none'; 
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

