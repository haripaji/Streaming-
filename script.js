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

// 3. Display Anime Cards
function displayAnime(animeList) {
    animeGrid.innerHTML = '';
    if (!animeList || animeList.length === 0) {
        animeGrid.innerHTML = `<p class="loading">No anime found.</p>`;
        return;
    }

    animeList.forEach(anime => {
        const animeCard = document.createElement('div');
        animeCard.classList.add('anime-card');
        
        animeCard.innerHTML = `
            <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
            <h4>${anime.title}</h4>
            <button class="add-btn" onclick="addToWatchlist('${anime.title.replace(/'/g, "\\'")}')">＋ Add to List</button>
        `;
        animeGrid.appendChild(animeCard);
    });
}

// 4. Search Functionality
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

// 5. Watchlist Management
window.addToWatchlist = function(title) {
    if (!watchlist.includes(title)) {
        watchlist.push(title);
        localStorage.setItem('animeWatchlist', JSON.stringify(watchlist));
        displayWatchlist();
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

