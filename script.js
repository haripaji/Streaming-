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
// पेज लोड होते ही टॉप एनिमे दिखाएं
window.addEventListener('DOMContentLoaded', () => {
    fetchAnime('https://api.jikan.moe/v4/top/anime');
    displayWatchlist();
});

// API से डेटा लाने का फंक्शन
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

// कार्ड्स स्क्रीन पर दिखाने का फंक्शन
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
// 5. VIDEO PLAYER FUNCTIONALITY
// ==========================================
window.playVideo = function(url, title) {
    if (url === 'null') {
        alert("Sorry! No trailer available for this anime.");
        return;
    }
    playerTitle.innerText = `Playing: ${title}`;
    videoPlayer.src = url; 
    playerSection.style.display = 'block'; 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
}

if (closePlayerBtn) {
    closePlayerBtn.addEventListener('click', () => {
        playerSection.style.display = 'none';
        videoPlayer.src = ''; 
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
