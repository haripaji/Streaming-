const animeGrid = document.getElementById('anime-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sectionTitle = document.getElementById('section-title');
const watchlistItems = document.getElementById('watchlist-items');

let watchlist = JSON.parse(localStorage.getItem('animeWatchlist')) || [];

// 1. Fetch Trending Anime on Load
window.addEventListener('DOMContentLoaded', () => {
    fetchAnime('https://api.jikan.moe/v4/top/anime');
    displayWatchlist();
});

// 2. Fetch Function from API
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

// नई variables प्लेयर के लिए (इसे फाइल के टॉप पर बाकी variables के साथ डालना)
const playerSection = document.getElementById('player-section');
const videoPlayer = document.getElementById('video-player');
const playerTitle = document.getElementById('player-title');
const closePlayerBtn = document.getElementById('close-player');

// 3. Display Anime Cards (Update this function)
function displayAnime(animeList) {
    animeGrid.innerHTML = '';
    if (!animeList || animeList.length === 0) {
        animeGrid.innerHTML = `<p class="loading">No anime found.</p>`;
        return;
    }

    animeList.forEach(anime => {
        const animeCard = document.createElement('div');
        animeCard.classList.add('anime-card');
        
        // चेक करें कि API से ट्रेलर URL मिला है या नहीं
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

// 6. New Video Player Functionality (इसे फाइल के सबसे नीचे डालें)
window.playVideo = function(url, title) {
    if (url === 'null') {
        alert("Sorry! No video available for this anime.");
        return;
    }
    playerTitle.innerText = `Playing: ${title}`;
    videoPlayer.src = url; // iFrame में वीडियो लोड करें
    playerSection.style.display = 'block'; // प्लेयर दिखाएं
    window.scrollTo({ top: 0, behavior: 'smooth' }); // पेज को ऊपर स्क्रॉल करें
}

// प्लेयर को बंद करने का कोड
if (closePlayerBtn) {
    closePlayerBtn.addEventListener('click', () => {
        playerSection.style.display = 'none';
        videoPlayer.src = ''; // वीडियो को बैकग्राउंड में बजने से रोकने के लिए
    });
}
