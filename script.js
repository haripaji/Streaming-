// ==========================================
// 0. SUPABASE CONNECTION (DATABASE)
// ==========================================
const supabaseUrl = 'https://maxalyasxiznqxmrzfzm.supabase.co';
const supabaseKey = 'Sb_publishable_0Vf4Ss_pKJjM4EzDebff4Q_0EWRYLXa';

// Supabase को चालू करना
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
console.log("Supabase Connected Successfully! 🚀");


// ==========================================
// 1. VARIABLES (सभी चीजों को सेलेक्ट करना)
// ==========================================
const animeGrid = document.getElementById('anime-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sectionTitle = document.getElementById('section-title');
const watchlistItems = document.getElementById('watchlist-items');

// Video Player Variables
const playerSection = document.getElementById('player-section');
const videoPlayer = document.getElementById('video-player');
const playerTitle = document.getElementById('player-title');
const closePlayerBtn = document.getElementById('close-player');

// Feedback Variables
const feedbackBtn = document.getElementById('feedback-btn');
const feedbackModal = document.getElementById('feedback-modal');
const closeFeedback = document.getElementById('close-feedback');
const feedbackForm = document.getElementById('feedback-form');

// LocalStorage से वॉचलिस्ट लोड करना
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
        animeGrid.innerHTML = `<p class="loading">Loading anime content...</p>`;
        const response = await fetch(url);
        const resData = await response.json();
        displayAnime(resData.data);
    } catch (error) {
        animeGrid.innerHTML = `<p class="loading" style="color:red;">Failed to load data. Please try again later.</p>`;
    }
}

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
        const safeTitle = anime.title.replace(/'/g, "\\'");

        animeCard.innerHTML = `
            <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
            <h4>${anime.title}</h4>
            <button class="play-btn" onclick="playVideo('${trailerUrl}', '${safeTitle}')">▶ Play Trailer</button>
            <button class="add-btn" onclick="addToWatchlist('${safeTitle}')">＋ Add to List</button>
        `;
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
// 5. VIDEO PLAYER & ACTIONS FUNCTIONALITY
// ==========================================
const likeBtn = document.getElementById('like-btn');
const likeText = document.getElementById('like-text');
const shareBtn = document.getElementById('share-btn');
const downloadBtn = document.getElementById('download-btn');
const commentBtn = document.getElementById('comment-btn');
const commentSection = document.getElementById('comment-section');
const commentInput = document.getElementById('comment-input');
const submitComment = document.getElementById('submit-comment');
const commentList = document.getElementById('comment-list');

let currentVideoTitle = "";
let currentVideoUrl = "";

window.playVideo = function(url, title) {
    if (url === 'null') {
        alert("Sorry! No video available for this.");
        return;
    }
    
    currentVideoTitle = title;
    currentVideoUrl = url;
    
    playerTitle.innerText = `Playing: ${title}`;
    videoPlayer.src = url; 
    playerSection.style.display = 'block'; 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
    
    checkLikeStatus(title);
    loadComments(title); // Supabase से कमेंट्स लोड करेगा
    commentSection.style.display = 'none';
}

if (closePlayerBtn) {
    closePlayerBtn.addEventListener('click', () => {
        playerSection.style.display = 'none';
        videoPlayer.src = ''; 
    });
}

// --- LIKE BUTTON LOGIC (LocalStorage) ---
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

function checkLikeStatus(title) {
    let likesData = JSON.parse(localStorage.getItem('animeLikes')) || {};
    if (likesData[title]) {
        likeBtn.classList.add('liked');
        likeBtn.innerHTML = `❤️ <span id="like-text">Liked</span>`;
    } else {
        likeBtn.classList.remove('liked');
        likeBtn.innerHTML = `🤍 <span id="like-text">Like</span>`;
    }
}

// --- SHARE BUTTON LOGIC ---
shareBtn.addEventListener('click', async () => {
    const shareData = { title: currentVideoTitle, text: `Watch ${currentVideoTitle} on AnimeFun!`, url: window.location.href };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Website Link copied to clipboard!");
        }
    } catch (err) { console.error("Error sharing:", err); }
});

// --- DOWNLOAD BUTTON LOGIC ---
downloadBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(currentVideoUrl);
    alert(`Downloading direct embedded videos is restricted.\n\nThe video link has been copied: ${currentVideoUrl}`);
});


// ==========================================
// 🚀 SUPABASE LIVE COMMENTS LOGIC 🚀
// ==========================================
commentBtn.addEventListener('click', () => {
    commentSection.style.display = commentSection.style.display === 'none' ? 'block' : 'none';
});

// कमेंट पोस्ट करना
submitComment.addEventListener('click', async () => {
    const text = commentInput.value.trim();
    if (text !== "") {
        submitComment.innerText = "Posting... ⏳";
        submitComment.disabled = true;

        // Supabase Database में सेव करना
        const { data, error } = await supabase
            .from('anime_comments')
            .insert([ { video_title: currentVideoTitle, comment_text: text } ]);

        if (error) {
            console.error("Error saving comment:", error);
            alert("Failed to post comment.");
        } else {
            commentInput.value = "";
            loadComments(currentVideoTitle); // नया कमेंट तुरंत स्क्रीन पर दिखाना
        }

        submitComment.innerText = "Post";
        submitComment.disabled = false;
    }
});

// कमेंट्स डेटाबेस से लोड करना
async function loadComments(title) {
    commentList.innerHTML = `<li style="text-align:center; color:#868686;">Loading live comments... ⏳</li>`;
    
    // Supabase Database से मंगाना
    const { data, error } = await supabase
        .from('anime_comments')
        .select('*')
        .eq('video_title', title)
        .order('created_at', { ascending: false });

    commentList.innerHTML = "";

    if (error) {
        console.error("Error loading comments:", error);
        commentList.innerHTML = `<li style="text-align:center; color:red;">Error loading comments.</li>`;
        return;
    }

    if (!data || data.length === 0) {
        commentList.innerHTML = `<li style="text-align:center; color:#868686;">No comments yet. Be the first!</li>`;
        return;
    }
    
    data.forEach(commentRow => {
        let li = document.createElement('li');
        li.innerHTML = `<strong>Guest:</strong> ${commentRow.comment_text}`;
        commentList.appendChild(li);
    });
}


// ==========================================
// 6. FEEDBACK FORM (GOOGLE SHEETS)
// ==========================================
if (feedbackBtn) {
    feedbackBtn.addEventListener('click', () => { feedbackModal.style.display = 'block'; });
}
if (closeFeedback) {
    closeFeedback.addEventListener('click', () => { feedbackModal.style.display = 'none'; });
}
window.addEventListener('click', (e) => {
    if (e.target === feedbackModal) { feedbackModal.style.display = 'none'; }
});

if (feedbackForm) {
    feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const submitBtn = feedbackForm.querySelector('.submit-btn');
        submitBtn.innerText = "Sending... ⏳";
        submitBtn.disabled = true;

        const scriptURL = 'https://script.google.com/macros/s/18VVfeDCnfWN6lxq62R8s4zkc7NgfrXHMsPYpxs_mffJuqCbq0jXgHufs/exec';

        fetch(scriptURL, { method: 'POST', mode: 'no-cors', body: new FormData(feedbackForm) })
        .then(() => {
            alert("Feedback sent successfully! Thank you. ❤️");
            feedbackForm.reset(); 
            feedbackModal.style.display = 'none'; 
            submitBtn.innerText = "Send Message 🚀";
            submitBtn.disabled = false;
        })
        .catch(error => {
            console.error('Error!', error.message);
            alert("Something went wrong. Please try again.");
            submitBtn.innerText = "Send Message 🚀";
            submitBtn.disabled = false;
        });
    });
}

// ==========================================
// 7. MOBILE WATCHLIST SLIDER
// ==========================================
const toggleWatchlistBtn = document.getElementById('toggle-watchlist');
const watchlistSidebar = document.querySelector('.watchlist-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');

if (toggleWatchlistBtn) {
    toggleWatchlistBtn.addEventListener('click', () => {
        watchlistSidebar.classList.toggle('active');
        if (watchlistSidebar.classList.contains('active')) {
            toggleWatchlistBtn.innerText = "✖ Close List";
            toggleWatchlistBtn.style.backgroundColor = "#1f2833";
        } else {
            toggleWatchlistBtn.innerText = "⭐ Watchlist";
            toggleWatchlistBtn.style.backgroundColor = "#ff4757";
        }
    });
}

if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', () => {
        watchlistSidebar.classList.remove('active');
        toggleWatchlistBtn.innerText = "⭐ Watchlist";
        toggleWatchlistBtn.style.backgroundColor = "#ff4757";
    });
}

document.addEventListener('click', (event) => {
    if (watchlistSidebar.classList.contains('active') && 
        !watchlistSidebar.contains(event.target) && 
        event.target !== toggleWatchlistBtn) {
        
        watchlistSidebar.classList.remove('active');
        toggleWatchlistBtn.innerText = "⭐ Watchlist";
        toggleWatchlistBtn.style.backgroundColor = "#ff4757";
    }
});
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
// 5. VIDEO PLAYER & ACTIONS FUNCTIONALITY
// ==========================================
const likeBtn = document.getElementById('like-btn');
const likeText = document.getElementById('like-text');
const shareBtn = document.getElementById('share-btn');
const downloadBtn = document.getElementById('download-btn');
const commentBtn = document.getElementById('comment-btn');
const commentSection = document.getElementById('comment-section');
const commentInput = document.getElementById('comment-input');
const submitComment = document.getElementById('submit-comment');
const commentList = document.getElementById('comment-list');

let currentVideoTitle = "";
let currentVideoUrl = "";

window.playVideo = function(url, title) {
    if (url === 'null') {
        alert("Sorry! No video available for this.");
        return;
    }
    
    currentVideoTitle = title;
    currentVideoUrl = url;
    
    playerTitle.innerText = `Playing: ${title}`;
    videoPlayer.src = url; 
    playerSection.style.display = 'block'; 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
    
    // लोड होते ही चेक करें कि क्या यूज़र ने इसे पहले लाइक किया था
    checkLikeStatus(title);
    // इस वीडियो के पुराने कमेंट्स लोड करें
    loadComments(title);
    // कमेंट सेक्शन को डिफ़ॉल्ट रूप से बंद रखें
    commentSection.style.display = 'none';
}

// Player Close
if (closePlayerBtn) {
    closePlayerBtn.addEventListener('click', () => {
        playerSection.style.display = 'none';
        videoPlayer.src = ''; 
    });
}

// --- LIKE BUTTON LOGIC ---
likeBtn.addEventListener('click', () => {
    let likesData = JSON.parse(localStorage.getItem('animeLikes')) || {};
    
    if (likesData[currentVideoTitle]) {
        // Unlike
        delete likesData[currentVideoTitle];
        likeBtn.classList.remove('liked');
        likeBtn.innerHTML = `🤍 <span id="like-text">Like</span>`;
    } else {
        // Like
        likesData[currentVideoTitle] = true;
        likeBtn.classList.add('liked');
        likeBtn.innerHTML = `❤️ <span id="like-text">Liked</span>`;
    }
    localStorage.setItem('animeLikes', JSON.stringify(likesData));
});

function checkLikeStatus(title) {
    let likesData = JSON.parse(localStorage.getItem('animeLikes')) || {};
    if (likesData[title]) {
        likeBtn.classList.add('liked');
        likeBtn.innerHTML = `❤️ <span id="like-text">Liked</span>`;
    } else {
        likeBtn.classList.remove('liked');
        likeBtn.innerHTML = `🤍 <span id="like-text">Like</span>`;
    }
}

// --- SHARE BUTTON LOGIC (Web Share API) ---
shareBtn.addEventListener('click', async () => {
    const shareData = {
        title: currentVideoTitle,
        text: `Watch ${currentVideoTitle} on AnimeFun!`,
        url: window.location.href
    };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            // अगर पीसी पर हैं तो लिंक कॉपी कर लें
            navigator.clipboard.writeText(window.location.href);
            alert("Website Link copied to clipboard!");
        }
    } catch (err) {
        console.error("Error sharing:", err);
    }
});

// --- DOWNLOAD BUTTON LOGIC ---
downloadBtn.addEventListener('click', () => {
    // यूट्यूब वीडियो सीधे डाउनलोड नहीं हो सकते, इसलिए हम लिंक कॉपी कर रहे हैं
    navigator.clipboard.writeText(currentVideoUrl);
    alert(`Downloading direct embedded videos is restricted.\n\nThe video link has been copied: ${currentVideoUrl}\nYou can paste it in any downloader tool.`);
});

// --- COMMENT BUTTON LOGIC ---
commentBtn.addEventListener('click', () => {
    if (commentSection.style.display === 'none') {
        commentSection.style.display = 'block';
    } else {
        commentSection.style.display = 'none';
    }
});

submitComment.addEventListener('click', () => {
    const text = commentInput.value.trim();
    if (text !== "") {
        let commentsData = JSON.parse(localStorage.getItem('animeComments')) || {};
        if (!commentsData[currentVideoTitle]) {
            commentsData[currentVideoTitle] = [];
        }
        
        commentsData[currentVideoTitle].push(text);
        localStorage.setItem('animeComments', JSON.stringify(commentsData));
        
        commentInput.value = "";
        loadComments(currentVideoTitle);
    }
});

function loadComments(title) {
    commentList.innerHTML = "";
    let commentsData = JSON.parse(localStorage.getItem('animeComments')) || {};
    let videoComments = commentsData[title] || [];
    
    if (videoComments.length === 0) {
        commentList.innerHTML = `<li style="text-align:center; color:#868686;">No comments yet. Be the first!</li>`;
        return;
    }
    
    videoComments.forEach(comment => {
        let li = document.createElement('li');
        li.innerHTML = `<strong>Guest:</strong> ${comment}`;
        commentList.appendChild(li);
    });
}



// ==========================================
// 6. FEEDBACK FORM (GOOGLE SHEETS)
// ==========================================
// Open Feedback Modal
if (feedbackBtn) {
    feedbackBtn.addEventListener('click', () => {
        feedbackModal.style.display = 'block';
    });
}

// Close Feedback Modal
if (closeFeedback) {
    closeFeedback.addEventListener('click', () => {
        feedbackModal.style.display = 'none';
    });
}

// Close Modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === feedbackModal) {
        feedbackModal.style.display = 'none';
    }
});

// Google Sheets Submit Logic
if (feedbackForm) {
    feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        
        const submitBtn = feedbackForm.querySelector('.submit-btn');
        submitBtn.innerText = "Sending... ⏳";
        submitBtn.disabled = true;

        // तुम्हारा Google Apps Script Web App URL
        const scriptURL = 'https://script.google.com/macros/s/18VVfeDCnfWN6lxq62R8s4zkc7NgfrXHMsPYpxs_mffJuqCbq0jXgHufs/exec';

        fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors',
            body: new FormData(feedbackForm)
        })
        .then(() => {
            alert("Feedback sent successfully! Thank you. ❤️");
            feedbackForm.reset(); 
            feedbackModal.style.display = 'none'; 
            submitBtn.innerText = "Send Message 🚀";
            submitBtn.disabled = false;
        })
        .catch(error => {
            console.error('Error!', error.message);
            alert("Something went wrong. Please try again.");
            submitBtn.innerText = "Send Message 🚀";
            submitBtn.disabled = false;
        });
    });
}
// ==========================================
// 7. MOBILE WATCHLIST SLIDER
// ==========================================
const toggleWatchlistBtn = document.getElementById('toggle-watchlist');
const watchlistSidebar = document.querySelector('.watchlist-sidebar');

if (toggleWatchlistBtn) {
    toggleWatchlistBtn.addEventListener('click', () => {
        // 'active' क्लास को चालू/बंद करेगा
        watchlistSidebar.classList.toggle('active');
        
        // बटन का टेक्स्ट चेंज करने के लिए
        if (watchlistSidebar.classList.contains('active')) {
            toggleWatchlistBtn.innerText = "✖ Close List";
            toggleWatchlistBtn.style.backgroundColor = "#1f2833";
        } else {
            toggleWatchlistBtn.innerText = "⭐ Watchlist";
            toggleWatchlistBtn.style.backgroundColor = "#ff4757";
        }
    });
}
const closeSidebarBtn = document.getElementById('close-sidebar-btn');

// 1. '✖' बटन दबाने पर स्लाइडर बंद करें
if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', () => {
        watchlistSidebar.classList.remove('active');
        toggleWatchlistBtn.innerText = "⭐ Watchlist";
        toggleWatchlistBtn.style.backgroundColor = "#ff4757";
    });
}

// 2. स्लाइडर के बाहर कहीं भी क्लिक करने पर उसे ऑटोमैटिक बंद करें
document.addEventListener('click', (event) => {
    // चेक करें कि स्लाइडर खुला है और क्लिक स्लाइडर या टॉगल बटन के बाहर हुआ है
    if (watchlistSidebar.classList.contains('active') && 
        !watchlistSidebar.contains(event.target) && 
        event.target !== toggleWatchlistBtn) {
        
        watchlistSidebar.classList.remove('active');
        toggleWatchlistBtn.innerText = "⭐ Watchlist";
        toggleWatchlistBtn.style.backgroundColor = "#ff4757";
    }
});
