// FrGDPS Demon List - Complete Enhanced JavaScript
// Global variables
let DEMON_DATA = [];
let PEMON_DATA = [];
let IMPOSSIBLE_DATA = [];
let FILTERED_DATA = [];
let FAVORITES = JSON.parse(localStorage.getItem('favorites')) || [];
let RECENTLY_VIEWED = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
let COMPLETED_LEVELS = JSON.parse(localStorage.getItem('completedLevels')) || [];
let USER_ACHIEVEMENTS = JSON.parse(localStorage.getItem('achievements')) || [];
let CURRENT_PAGE = 1;
const ITEMS_PER_PAGE = 12;
let CURRENT_SORT = 'rank';
let CURRENT_FILTER = 'all';
let VIEW_MODE = 'grid';
let SELECTED_FOR_COMPARE = [];
let USER_PROFILE = JSON.parse(localStorage.getItem('userProfile')) || {
  username: 'Guest',
  avatar: null,
  completedCount: 0,
  favoriteCount: 0,
  level: 1,
  experience: 0
};

// Google Sheets URLs for real data
const DATA_SOURCES = {
  demonlist: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSDN7HUdFLEi7P5CkSFXFz_b16Os_8hdEItayViA0TfNze8nudO6sxlJgL9h2K8gkYMQah6RS1KXvL2/pub?gid=1550981254&single=true&output=csv',
  pemonlist: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSDN7HUdFLEi7P5CkSFXFz_b16Os_8hdEItayViA0TfNze8nudO6sxlJgL9h2K8gkYMQah6RS1KXvL2/pub?gid=1550981255&single=true&output=csv',
  impossiblelist: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSDN7HUdFLEi7P5CkSFXFz_b16Os_8hdEItayViA0TfNze8nudO6sxlJgL9h2K8gkYMQah6RS1KXvL2/pub?gid=1550981256&single=true&output=csv'
};

// Achievement definitions
const ACHIEVEMENTS = {
  firstLevel: {
    id: 'firstLevel',
    title: 'First Steps',
    description: 'View your first level',
    icon: 'fa-shoe-prints',
    condition: () => RECENTLY_VIEWED.length >= 1
  },
  explorer: {
    id: 'explorer',
    title: 'Explorer',
    description: 'View 10 different levels',
    icon: 'fa-compass',
    condition: () => RECENTLY_VIEWED.length >= 10
  },
  collector: {
    id: 'collector',
    title: 'Collector',
    description: 'Add 5 levels to favorites',
    icon: 'fa-heart',
    condition: () => FAVORITES.length >= 5
  },
  completer: {
    id: 'completer',
    title: 'Demon Slayer',
    description: 'Complete 3 levels',
    icon: 'fa-skull',
    condition: () => COMPLETED_LEVELS.length >= 3
  },
  master: {
    id: 'master',
    title: 'Demon Master',
    description: 'Complete 10 levels',
    icon: 'fa-crown',
    condition: () => COMPLETED_LEVELS.length >= 10
  },
  reviewer: {
    id: 'reviewer',
    title: 'Critic',
    description: 'Rate 5 levels',
    icon: 'fa-star',
    condition: () => USER_PROFILE.experience >= 50
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  loadData();
  checkAchievements();
});

function initializeApp() {
  // Set current year
  const currentYear = new Date().getFullYear();
  const yearElements = document.querySelectorAll('#year, #footerYear');
  yearElements.forEach(el => {
    if (el) el.textContent = currentYear;
  });
  
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
  
  // Initialize event listeners
  initializeEventListeners();
  
  // Update user profile
  updateUserProfile();
  
  // Load user preferences
  loadUserPreferences();
  
  // Initialize service worker for offline support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('Service worker registration failed:', err);
    });
  }
}

function initializeEventListeners() {
  // Sidebar navigation
  const sidebar = document.getElementById('sidebarNav');
  const openSidebarBtn = document.getElementById('openSidebar');
  const closeSidebarBtn = document.getElementById('closeSidebar');
  
  if (openSidebarBtn && closeSidebarBtn) {
    openSidebarBtn.onclick = () => sidebar.classList.add('active');
    closeSidebarBtn.onclick = () => sidebar.classList.remove('active');
    
    // Close sidebar on click outside
    document.addEventListener('click', (e) => {
      if (
        sidebar.classList.contains('active') &&
        !sidebar.contains(e.target) &&
        e.target !== openSidebarBtn && !openSidebarBtn.contains(e.target)
      ) sidebar.classList.remove('active');
    });
  }
  
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
  }
  
  // Filters
  const difficultyFilter = document.getElementById('difficultyFilter');
  const sortFilter = document.getElementById('sortFilter');
  
  if (difficultyFilter) {
    difficultyFilter.addEventListener('click', toggleDifficultyMenu);
  }
  
  if (sortFilter) {
    sortFilter.addEventListener('click', toggleSortMenu);
  }
  
  // Filter options
  const difficultyOptions = document.querySelectorAll('#difficultyMenu .filter-option');
  difficultyOptions.forEach(option => {
    option.addEventListener('click', () => handleDifficultyFilter(option));
  });
  
  const sortOptions = document.querySelectorAll('#sortMenu .filter-option');
  sortOptions.forEach(option => {
    option.addEventListener('click', () => handleSortFilter(option));
  });
  
  // View controls
  const gridView = document.getElementById('gridView');
  const listView = document.getElementById('listView');
  
  if (gridView) {
    gridView.addEventListener('click', () => setViewMode('grid'));
  }
  
  if (listView) {
    listView.addEventListener('click', () => setViewMode('list'));
  }
  
  // Action buttons
  const randomBtn = document.getElementById('randomBtn');
  const compareBtn = document.getElementById('compareBtn');
  const advancedFilterBtn = document.getElementById('advancedFilterBtn');
  
  if (randomBtn) {
    randomBtn.addEventListener('click', showRandomDemon);
  }
  
  if (compareBtn) {
    compareBtn.addEventListener('click', toggleCompareMode);
  }
  
  if (advancedFilterBtn) {
    advancedFilterBtn.addEventListener('click', toggleAdvancedFilters);
  }
  
  // Modal controls
  const closeVideoModal = document.getElementById('closeVideoModal');
  const closeDetailsModal = document.getElementById('closeDetailsModal');
  const closeDetails = document.getElementById('closeDetails');
  const watchVideo = document.getElementById('watchVideo');
  
  if (closeVideoModal) {
    closeVideoModal.addEventListener('click', closeVideoModalFn);
  }
  
  if (closeDetailsModal) {
    closeDetailsModal.addEventListener('click', closeDetailsModalFn);
  }
  
  if (closeDetails) {
    closeDetails.addEventListener('click', closeDetailsModalFn);
  }
  
  if (watchVideo) {
    watchVideo.addEventListener('click', () => {
      const videoId = watchVideo.dataset.videoId;
      if (videoId) {
        closeDetailsModalFn();
        openModal(videoId);
      }
    });
  }
  
  // Close modals on background click
  const videoModal = document.getElementById('videoModal');
  const detailsModal = document.getElementById('detailsModal');
  
  if (videoModal) {
    videoModal.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeVideoModalFn();
    });
  }
  
  if (detailsModal) {
    detailsModal.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeDetailsModalFn();
    });
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeVideoModalFn();
      closeDetailsModalFn();
    }
    
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.focus();
    }
    
    // Ctrl/Cmd + F for favorites
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      showFavorites();
    }
  });
  
  // Sidebar links
  const favoritesLink = document.getElementById('favoritesLink');
  const recentLink = document.getElementById('recentLink');
  
  if (favoritesLink) {
    favoritesLink.addEventListener('click', (e) => {
      e.preventDefault();
      showFavorites();
    });
  }
  
  if (recentLink) {
    recentLink.addEventListener('click', (e) => {
      e.preventDefault();
      showRecentlyViewed();
    });
  }
  
  // Advanced filter actions
  const applyFiltersBtn = document.getElementById('applyFilters');
  const resetFiltersBtn = document.getElementById('resetFilters');
  
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', applyAdvancedFilters);
  }
  
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', resetAdvancedFilters);
  }
  
  // Range inputs
  const rangeInputs = document.querySelectorAll('input[type="range"]');
  rangeInputs.forEach(input => {
    input.addEventListener('input', updateRangeValue);
  });
  
  // Infinite scroll
  window.addEventListener('scroll', throttle(handleInfiniteScroll, 200));
}

// Data functions with enhanced error handling
function loadData() {
  const loadingMsg = document.getElementById('loadingMsg');
  const cardGrid = document.getElementById('demonCardGrid');
  
  if (!cardGrid) return;
  
  // Show skeleton loading
  cardGrid.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    cardGrid.appendChild(createSkeletonCard());
  }
  
  // Determine which data source to use based on current page
  let dataSource;
  let dataVariable;
  
  if (window.location.pathname.includes('pemonlist.html')) {
    dataSource = DATA_SOURCES.pemonlist;
    dataVariable = 'PEMON_DATA';
  } else if (window.location.pathname.includes('impossiblelist.html')) {
    dataSource = DATA_SOURCES.impossiblelist;
    dataVariable = 'IMPOSSIBLE_DATA';
  } else {
    dataSource = DATA_SOURCES.demonlist;
    dataVariable = 'DEMON_DATA';
  }
  
  // Load data from Google Sheets with timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), 10000);
  });
  
  const dataPromise = fetch(dataSource)
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.text();
    })
    .then(csvText => {
      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          header: true,
          complete: resolve,
          error: reject
        });
      });
    });
  
  Promise.race([dataPromise, timeoutPromise])
    .then(res => {
      const valid = res.data.filter(r => {
        const levelName = r.Level || r.Name || '';
        return levelName.trim() !== '';
      });
      
      if (valid.length === 0) {
        handleDataError(new Error('No valid data found'));
        return;
      }
      
      // Store data in appropriate variable
      if (dataVariable === 'PEMON_DATA') {
        PEMON_DATA = valid;
        FILTERED_DATA = [...valid];
      } else if (dataVariable === 'IMPOSSIBLE_DATA') {
        IMPOSSIBLE_DATA = valid;
        FILTERED_DATA = [...valid];
      } else {
        DEMON_DATA = valid;
        FILTERED_DATA = [...valid];
      }
      
      // Cache data for offline use
      localStorage.setItem('cachedDemonData', JSON.stringify(valid));
      localStorage.setItem('lastDataUpdate', new Date().toISOString());
      
      // Apply filters and render
      applyFiltersAndSort();
      updateStats();
      
      if (loadingMsg) loadingMsg.style.display = 'none';
      
      // Show success message
      const listType = dataVariable === 'PEMON_DATA' ? 'Pemon' : 
                      dataVariable === 'IMPOSSIBLE_DATA' ? 'Impossible' : 'Demon';
      showToast(`Loaded ${valid.length} ${listType} levels`, 'success');
      
      // Start real-time updates check
      startRealTimeUpdates();
    })
    .catch(err => {
      handleDataError(err);
    });
}

function handleDataError(error) {
  console.error('Data loading error:', error);
  
  const cardGrid = document.getElementById('demonCardGrid');
  if (!cardGrid) return;
  
  // Create a more informative error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-container';
  errorDiv.innerHTML = `
    <div class="error-content">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>Unable to Load Data</h3>
      <p>We're having trouble loading level data from Google Sheets.</p>
      <p>This might be due to:</p>
      <ul>
        <li>Network connectivity issues</li>
        <li>Google Sheets being temporarily unavailable</li>
        <li>Changes in data structure</li>
        <li>CORS restrictions</li>
      </ul>
      <div class="error-actions">
        <button class="action-btn" onclick="retryLoading()">
          <i class="fas fa-redo"></i> Retry
        </button>
        <button class="action-btn" onclick="loadCachedData()">
          <i class="fas fa-database"></i> Use Cached Data
        </button>
        <button class="action-btn" onclick="loadSampleData()">
          <i class="fas fa-flask"></i> Load Sample Data
        </button>
      </div>
    </div>
  `;
  
  cardGrid.innerHTML = '';
  cardGrid.appendChild(errorDiv);
  
  // Hide loading message
  const loadingMsg = document.getElementById('loadingMsg');
  if (loadingMsg) loadingMsg.style.display = 'none';
  
  showToast('Failed to load data from Google Sheets', 'error');
}

function retryLoading() {
  location.reload();
}

function loadCachedData() {
  const cachedData = localStorage.getItem('cachedDemonData');
  
  if (cachedData) {
    try {
      const data = JSON.parse(cachedData);
      
      // Determine which data to use based on current page
      if (window.location.pathname.includes('pemonlist.html')) {
        PEMON_DATA = data;
        FILTERED_DATA = [...data];
      } else if (window.location.pathname.includes('impossiblelist.html')) {
        IMPOSSIBLE_DATA = data;
        FILTERED_DATA = [...data];
      } else {
        DEMON_DATA = data;
        FILTERED_DATA = [...data];
      }
      
      applyFiltersAndSort();
      updateStats();
      
      const lastUpdate = localStorage.getItem('lastDataUpdate');
      if (lastUpdate) {
        const date = new Date(lastUpdate);
        showToast(`Loaded cached data from ${formatDate(date)}`, 'info');
      } else {
        showToast('Loaded cached data. Information may be outdated.', 'info');
      }
    } catch (e) {
      console.error('Error parsing cached data:', e);
      showToast('No cached data available', 'error');
      retryLoading();
    }
  } else {
    showToast('No cached data available', 'error');
    retryLoading();
  }
}

function loadSampleData() {
  // Sample data for testing
  const sampleData = [
    {
      Level: 'Sample Demon',
      'ID Level': '123456',
      Creators: 'SampleCreator',
      'Display Nickname': 'SampleVerifier',
      'Level Placement Opinion': 'Extreme',
      'Video Link': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      Rating: 4.5,
      Tags: 'Sample,Test,Demo'
    }
  ];
  
  // Determine which data to use based on current page
  if (window.location.pathname.includes('pemonlist.html')) {
    PEMON_DATA = sampleData;
    FILTERED_DATA = [...sampleData];
  } else if (window.location.pathname.includes('impossiblelist.html')) {
    IMPOSSIBLE_DATA = sampleData;
    FILTERED_DATA = [...sampleData];
  } else {
    DEMON_DATA = sampleData;
    FILTERED_DATA = [...sampleData];
  }
  
  applyFiltersAndSort();
  updateStats();
  showToast('Loaded sample data for testing', 'info');
}

function createSkeletonCard() {
  const card = document.createElement('div');
  card.className = 'skeleton-card';
  
  const thumb = document.createElement('div');
  thumb.className = 'skeleton skeleton-thumb';
  
  const content = document.createElement('div');
  content.className = 'skeleton-content';
  
  const title = document.createElement('div');
  title.className = 'skeleton skeleton-title';
  
  const info = document.createElement('div');
  info.className = 'skeleton skeleton-info';
  
  const creator = document.createElement('div');
  creator.className = 'skeleton skeleton-creator';
  
  content.appendChild(title);
  content.appendChild(info);
  content.appendChild(creator);
  
  card.appendChild(thumb);
  card.appendChild(content);
  
  return card;
}

function updateStats() {
  const totalDemons = document.getElementById('totalDemons');
  const extremeDemons = document.getElementById('extremeDemons');
  const lastUpdated = document.getElementById('lastUpdated');
  
  // Determine which data to use based on current page
  let currentData;
  let listType;
  
  if (window.location.pathname.includes('pemonlist.html')) {
    currentData = PEMON_DATA;
    listType = 'Pemons';
  } else if (window.location.pathname.includes('impossiblelist.html')) {
    currentData = IMPOSSIBLE_DATA;
    listType = 'Impossible';
  } else {
    currentData = DEMON_DATA;
    listType = 'Demons';
  }
  
  if (totalDemons) {
    animateNumber(totalDemons, currentData.length);
  }
  
  if (extremeDemons) {
    // Count extreme levels based on difficulty column
    const extremeCount = currentData.filter(r => {
      const difficulty = (r['Level Placement Opinion'] || r['Difficulty'] || '').toLowerCase();
      return difficulty === 'extreme' || difficulty === 'impossible';
    }).length;
    animateNumber(extremeDemons, extremeCount);
  }
  
  if (lastUpdated) {
    lastUpdated.textContent = formatDate(new Date());
  }
}

function animateNumber(element, target) {
  const start = parseInt(element.textContent) || 0;
  const duration = 1000;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.floor(start + (target - start) * progress);
    element.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Enhanced filter and sort functions
function handleSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  
  const term = searchInput.value.trim().toLowerCase();
  CURRENT_PAGE = 1;
  
  // Add search to history
  addToSearchHistory(term);
  
  applyFiltersAndSort();
}

function addToSearchHistory(term) {
  if (!term) return;
  
  let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
  history = history.filter(h => h !== term);
  history.unshift(term);
  history = history.slice(0, 10); // Keep only last 10 searches
  localStorage.setItem('searchHistory', JSON.stringify(history));
}

function toggleDifficultyMenu() {
  const menu = document.getElementById('difficultyMenu');
  if (!menu) return;
  
  menu.classList.toggle('active');
  
  // Close sort menu if open
  const sortMenu = document.getElementById('sortMenu');
  if (sortMenu) sortMenu.classList.remove('active');
}

function toggleSortMenu() {
  const menu = document.getElementById('sortMenu');
  if (!menu) return;
  
  menu.classList.toggle('active');
  
  // Close difficulty menu if open
  const difficultyMenu = document.getElementById('difficultyMenu');
  if (difficultyMenu) difficultyMenu.classList.remove('active');
}

function handleDifficultyFilter(option) {
  // Update active state
  document.querySelectorAll('#difficultyMenu .filter-option').forEach(opt => {
    opt.classList.remove('active');
  });
  option.classList.add('active');
  
  // Update filter
  CURRENT_FILTER = option.dataset.value;
  CURRENT_PAGE = 1;
  
  // Update button text
  const difficultyFilter = document.getElementById('difficultyFilter');
  if (difficultyFilter) {
    const span = difficultyFilter.querySelector('span');
    if (span) {
      span.textContent = option.dataset.value === 'all' ? 'Difficulty' : option.textContent;
    }
  }
  
  // Close menu
  const difficultyMenu = document.getElementById('difficultyMenu');
  if (difficultyMenu) difficultyMenu.classList.remove('active');
  
  // Apply filter
  applyFiltersAndSort();
}

function handleSortFilter(option) {
  // Update active state
  document.querySelectorAll('#sortMenu .filter-option').forEach(opt => {
    opt.classList.remove('active');
  });
  option.classList.add('active');
  
  // Update sort
  CURRENT_SORT = option.dataset.value;
  CURRENT_PAGE = 1;
  
  // Update button text
  const sortFilter = document.getElementById('sortFilter');
  if (sortFilter) {
    const span = sortFilter.querySelector('span');
    if (span) {
      span.textContent = option.textContent;
    }
  }
  
  // Close menu
  const sortMenu = document.getElementById('sortMenu');
  if (sortMenu) sortMenu.classList.remove('active');
  
  // Apply sort
  applyFiltersAndSort();
}

function applyFiltersAndSort() {
  const searchInput = document.getElementById('searchInput');
  const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
  
  // Determine which data to use based on current page
  let currentData;
  
  if (window.location.pathname.includes('pemonlist.html')) {
    currentData = PEMON_DATA;
  } else if (window.location.pathname.includes('impossiblelist.html')) {
    currentData = IMPOSSIBLE_DATA;
  } else {
    currentData = DEMON_DATA;
  }
  
  // Apply search filter
  FILTERED_DATA = currentData.filter(row => {
    if (searchTerm && !Object.values(row).join(' ').toLowerCase().includes(searchTerm)) {
      return false;
    }
    
    if (CURRENT_FILTER !== 'all') {
      // Handle different column names for different lists
      const difficultyColumn = row['Level Placement Opinion'] || row['Difficulty'] || '';
      const difficulty = difficultyColumn.toLowerCase();
      if (difficulty !== CURRENT_FILTER) {
        return false;
      }
    }
    
    return true;
  });
  
  // Apply sort
  FILTERED_DATA.sort((a, b) => {
    switch (CURRENT_SORT) {
      case 'name':
        return (a.Level || a.Name || '').localeCompare(b.Level || b.Name || '');
      case 'difficulty':
        const difficultyOrder = { easy: 1, medium: 2, hard: 3, insane: 4, extreme: 5, impossible: 6 };
        const aDiffColumn = a['Level Placement Opinion'] || a['Difficulty'] || '';
        const bDiffColumn = b['Level Placement Opinion'] || b['Difficulty'] || '';
        const aDiff = aDiffColumn.toLowerCase();
        const bDiff = bDiffColumn.toLowerCase();
        return difficultyOrder[aDiff] - difficultyOrder[bDiff];
      case 'creator':
        return (a.Creators || a['Creator'] || '').localeCompare(b.Creators || b['Creator'] || '');
      case 'rating':
        const aRating = parseFloat(a.Rating) || 0;
        const bRating = parseFloat(b.Rating) || 0;
        return bRating - aRating;
      case 'rank':
      default:
        // Keep original order (rank)
        return 0;
    }
  });
  
  // Render
  renderCards();
  renderPagination();
}

// View functions
function setViewMode(mode) {
  VIEW_MODE = mode;
  const grid = document.getElementById('demonCardGrid');
  const gridBtn = document.getElementById('gridView');
  const listBtn = document.getElementById('listView');
  
  if (!grid) return;
  
  if (mode === 'grid') {
    grid.classList.remove('list-view');
    if (gridBtn) gridBtn.classList.add('active');
    if (listBtn) listBtn.classList.remove('active');
  } else {
    grid.classList.add('list-view');
    if (gridBtn) gridBtn.classList.remove('active');
    if (listBtn) listBtn.classList.add('active');
  }
  
  // Save preference
  localStorage.setItem('viewMode', mode);
  
  // Re-render with new view mode
  renderCards();
}

// Enhanced card rendering
function renderCards() {
  const cardGrid = document.getElementById('demonCardGrid');
  if (!cardGrid) return;
  
  cardGrid.innerHTML = '';
  
  if (!FILTERED_DATA.length) {
    cardGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); margin-top: 2rem; padding: 2rem;">
        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
        <h3>No levels found</h3>
        <p>Try adjusting your search or filters</p>
        <button class="action-btn" onclick="resetFilters()" style="margin-top: 1rem;">
          <i class="fas fa-redo"></i> Reset Filters
        </button>
      </div>
    `;
    return;
  }
  
  // Calculate pagination
  const startIndex = (CURRENT_PAGE - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageData = FILTERED_DATA.slice(startIndex, endIndex);
  
  // Render cards for current page
  pageData.forEach((row, index) => {
    const globalIndex = startIndex + index + 1;
    const card = createDemonCard(row, globalIndex);
    cardGrid.appendChild(card);
  });
  
  // Add intersection observer for lazy loading
  setupLazyLoading();
}

function createDemonCard(row, rank) {
  // Handle different column names for different lists
  const name = row['Level'] || row['Name'] || '-';
  const id = row['ID Level'] || row['ID'] || '-';
  const creator = row['Creators'] || row['Creator'] || '-';
  const verifier = row['Display Nickname'] || row['Verifier'] || creator;
  const videoUrl = row['Video Link'] || row['Video'] || '';
  const difficultyColumn = row['Level Placement Opinion'] || row['Difficulty'] || 'Extreme';
  const difficulty = difficultyColumn.toLowerCase();
  const rating = row['Rating'] || 0;
  const tags = row['Tags'] ? row['Tags'].split(',').map(tag => tag.trim()) : [];
  const description = row['Description'] || '';
  
  const videoId = getYouTubeId(videoUrl);
  const isFavorite = FAVORITES.includes(id);
  const isCompleted = COMPLETED_LEVELS.includes(id);
  
  // Create card element
  const card = document.createElement('div');
  card.className = 'demon-card';
  card.dataset.id = id;
  
  // Rank badge
  const rankDiv = document.createElement('div');
  rankDiv.className = 'card-rank';
  rankDiv.textContent = rank;
  card.appendChild(rankDiv);
  
  // Favorite button
  const favoriteBtn = document.createElement('div');
  favoriteBtn.className = `card-favorite ${isFavorite ? 'active' : ''}`;
  favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
  favoriteBtn.addEventListener('click', () => toggleFavorite(id));
  card.appendChild(favoriteBtn);
  
  // Completion badge
  if (isCompleted) {
    const completionBadge = document.createElement('div');
    completionBadge.className = 'completion-badge';
    completionBadge.innerHTML = '<i class="fas fa-check"></i> Completed';
    card.appendChild(completionBadge);
  }
  
  // Thumbnail
  if (videoId) {
    const thumbWrap = document.createElement('div');
    thumbWrap.style.position = 'relative';
    
    const thumb = document.createElement('img');
    thumb.className = 'card-thumb';
    thumb.src = getYouTubeThumbnail(videoId);
    thumb.alt = `Preview for ${name}`;
    thumb.title = "Play video";
    thumb.loading = 'lazy';
    thumb.addEventListener('click', () => {
      openModal(videoId);
      addToRecentlyViewed(row);
    });
    thumbWrap.appendChild(thumb);
    
    // Play overlay
    const playBtn = document.createElement('div');
    playBtn.className = 'play-btn-overlay';
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    thumbWrap.appendChild(playBtn);
    
    card.appendChild(thumbWrap);
  } else {
    const noVid = document.createElement('div');
    noVid.className = 'no-video-thumb';
    noVid.textContent = "No Video";
    card.appendChild(noVid);
  }
  
  // Content
  const content = document.createElement('div');
  content.className = 'card-content';
  
  // Title
  const title = document.createElement('div');
  title.className = 'level-title';
  title.textContent = name;
  title.addEventListener('click', () => {
    showLevelDetails(row);
    addToRecentlyViewed(row);
  });
  content.appendChild(title);
  
  // Description (if available)
  if (description) {
    const desc = document.createElement('div');
    desc.className = 'level-description';
    desc.textContent = description.length > 100 ? description.substring(0, 100) + '...' : description;
    desc.style.fontSize = '0.9rem';
    desc.style.color = 'var(--text-muted)';
    desc.style.marginBottom = '0.5rem';
    content.appendChild(desc);
  }
  
  // Diff/ID Row
  const infoRow = document.createElement('div');
  infoRow.className = 'level-info-row';
  
  const diffSpan = document.createElement('span');
  diffSpan.className = `diff-pill ${difficulty}`;
  diffSpan.textContent = difficulty;
  infoRow.appendChild(diffSpan);
  
  const idSpan = document.createElement('span');
  idSpan.className = 'lvl-id-badge';
  idSpan.textContent = `ID: ${id}`;
  infoRow.appendChild(idSpan);
  
  content.appendChild(infoRow);
  
  // Creator/Verifier
  const creatorRow = document.createElement('div');
  creatorRow.className = 'creator-row';
  creatorRow.innerHTML =
    `<span title="Creator"><i class="fas fa-user-edit"></i> ${creator}</span>` +
    `<span title="Verifier"><i class="fas fa-check-circle"></i> ${verifier}</span>`;
  content.appendChild(creatorRow);
  
  // Rating
  if (rating > 0) {
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'rating-container';
    
    const ratingStars = document.createElement('div');
    ratingStars.className = 'rating-stars';
    
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('i');
      star.className = i <= rating ? 'fas fa-star' : 'far fa-star';
      ratingStars.appendChild(star);
    }
    
    const ratingValue = document.createElement('div');
    ratingValue.className = 'rating-value';
    ratingValue.textContent = `${rating}/5`;
    
    ratingContainer.appendChild(ratingStars);
    ratingContainer.appendChild(ratingValue);
    content.appendChild(ratingContainer);
  }
  
  // Tags
  if (tags.length > 0) {
    const filterTags = document.createElement('div');
    filterTags.className = 'filter-tags';
    
    tags.slice(0, 3).forEach(tag => {
      const filterTag = document.createElement('div');
      filterTag.className = 'filter-tag';
      filterTag.textContent = tag;
      filterTag.addEventListener('click', () => {
        filterByTag(tag);
      });
      filterTags.appendChild(filterTag);
    });
    
    content.appendChild(filterTags);
  }
  
  // Actions
  const actions = document.createElement('div');
  actions.className = 'card-actions';
  
  const detailsBtn = document.createElement('button');
  detailsBtn.className = 'card-action-btn';
  detailsBtn.innerHTML = '<i class="fas fa-info-circle"></i> Details';
  detailsBtn.addEventListener('click', () => {
    showLevelDetails(row);
    addToRecentlyViewed(row);
  });
  actions.appendChild(detailsBtn);
  
  const compareBtn = document.createElement('button');
  compareBtn.className = 'card-action-btn';
  compareBtn.innerHTML = '<i class="fas fa-balance-scale"></i> Compare';
  compareBtn.addEventListener('click', () => addToCompare(row));
  actions.appendChild(compareBtn);
  
  if (!isCompleted) {
    const completeBtn = document.createElement('button');
    completeBtn.className = 'card-action-btn';
    completeBtn.innerHTML = '<i class="fas fa-check"></i> Mark Complete';
    completeBtn.addEventListener('click', () => markAsCompleted(id));
    actions.appendChild(completeBtn);
  }
  
  // Share button
  const shareBtn = document.createElement('button');
  shareBtn.className = 'card-action-btn';
  shareBtn.innerHTML = '<i class="fas fa-share"></i> Share';
  shareBtn.addEventListener('click', () => shareLevel(row));
  actions.appendChild(shareBtn);
  
  content.appendChild(actions);
  
  card.appendChild(content);
  
  return card;
}

// Pagination with enhanced functionality
function renderPagination() {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;
  
  pagination.innerHTML = '';
  
  const totalPages = Math.ceil(FILTERED_DATA.length / ITEMS_PER_PAGE);
  
  if (totalPages <= 1) return;
  
  // First button
  const firstBtn = document.createElement('button');
  firstBtn.className = 'page-btn';
  firstBtn.innerHTML = '<i class="fas fa-angle-double-left"></i>';
  firstBtn.disabled = CURRENT_PAGE === 1;
  firstBtn.addEventListener('click', () => {
    CURRENT_PAGE = 1;
    renderCards();
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  pagination.appendChild(firstBtn);
  
  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevBtn.disabled = CURRENT_PAGE === 1;
  prevBtn.addEventListener('click', () => {
    if (CURRENT_PAGE > 1) {
      CURRENT_PAGE--;
      renderCards();
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  pagination.appendChild(prevBtn);
  
  // Page numbers
  const startPage = Math.max(1, CURRENT_PAGE - 2);
  const endPage = Math.min(totalPages, CURRENT_PAGE + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `page-btn ${i === CURRENT_PAGE ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener('click', () => {
      CURRENT_PAGE = i;
      renderCards();
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    pagination.appendChild(pageBtn);
  }
  
  // Page info
  const pageInfo = document.createElement('div');
  pageInfo.className = 'page-info';
  pageInfo.textContent = `Page ${CURRENT_PAGE} of ${totalPages}`;
  pagination.appendChild(pageInfo);
  
  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextBtn.disabled = CURRENT_PAGE === totalPages;
  nextBtn.addEventListener('click', () => {
    if (CURRENT_PAGE < totalPages) {
      CURRENT_PAGE++;
      renderCards();
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  pagination.appendChild(nextBtn);
  
  // Last button
  const lastBtn = document.createElement('button');
  lastBtn.className = 'page-btn';
  lastBtn.innerHTML = '<i class="fas fa-angle-double-right"></i>';
  lastBtn.disabled = CURRENT_PAGE === totalPages;
  lastBtn.addEventListener('click', () => {
    CURRENT_PAGE = totalPages;
    renderCards();
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  pagination.appendChild(lastBtn);
}

// Modal functions with enhanced features
function openModal(videoId) {
  const modal = document.getElementById('videoModal');
  const youtubeFrame = document.getElementById('youtubeFrame');
  
  if (!modal || !youtubeFrame) return;
  
  youtubeFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Add to viewing history
  const viewingHistory = JSON.parse(localStorage.getItem('viewingHistory')) || [];
  viewingHistory.unshift({ videoId, timestamp: Date.now() });
  localStorage.setItem('viewingHistory', JSON.stringify(viewingHistory.slice(0, 50)));
}

function closeVideoModalFn() {
  const modal = document.getElementById('videoModal');
  const youtubeFrame = document.getElementById('youtubeFrame');
  
  if (!modal || !youtubeFrame) return;
  
  modal.classList.remove('active');
  youtubeFrame.src = '';
  document.body.style.overflow = '';
}

function showLevelDetails(level) {
  const modal = document.getElementById('detailsModal');
  const modalTitle = document.getElementById('detailsModalTitle');
  const levelDetails = document.getElementById('levelDetails');
  const watchVideoBtn = document.getElementById('watchVideo');
  
  if (!modal || !modalTitle || !levelDetails) return;
  
  // Handle different column names for different lists
  const name = level['Level'] || level['Name'] || '-';
  const id = level['ID Level'] || level['ID'] || '-';
  const creator = level['Creators'] || level['Creator'] || '-';
  const verifier = level['Display Nickname'] || level['Verifier'] || creator;
  const videoUrl = level['Video Link'] || level['Video'] || '';
  const difficultyColumn = level['Level Placement Opinion'] || level['Difficulty'] || 'Unknown';
  const difficulty = difficultyColumn.toLowerCase();
  const rating = level['Rating'] || 0;
  const tags = level['Tags'] ? level['Tags'].split(',').map(tag => tag.trim()) : [];
  const description = level['Description'] || 'No description available';
  const length = level['Length'] || 'Unknown';
  const objects = level['Objects'] || 'Unknown';
  const downloads = level['Downloads'] || '0';
  
  modalTitle.textContent = name;
  
  const videoId = getYouTubeId(videoUrl);
  if (watchVideoBtn) {
    watchVideoBtn.dataset.videoId = videoId || '';
    watchVideoBtn.disabled = !videoId;
  }
  
  const isCompleted = COMPLETED_LEVELS.includes(id);
  const isFavorite = FAVORITES.includes(id);
  
  levelDetails.innerHTML = `
    <div class="detail-group">
      <div class="detail-label">Rank</div>
      <div class="detail-value">#${getCurrentRank(level)}</div>
    </div>
    <div class="detail-group">
      <div class="detail-label">Level ID</div>
      <div class="detail-value">${id}</div>
    </div>
    <div class="detail-group">
      <div class="detail-label">Creator</div>
      <div class="detail-value">${creator}</div>
    </div>
    <div class="detail-group">
      <div class="detail-label">Verifier</div>
      <div class="detail-value">${verifier}</div>
    </div>
    <div class="detail-group">
      <div class="detail-label">Difficulty</div>
      <div class="detail-value">
        <span class="diff-pill ${difficulty}">${difficultyColumn}</span>
      </div>
    </div>
    <div class="detail-group">
      <div class="detail-label">Rating</div>
      <div class="detail-value">
        ${generateStarRating(rating)}
      </div>
    </div>
    <div class="detail-group">
      <div class="detail-label">Length</div>
      <div class="detail-value">${length}</div>
    </div>
    <div class="detail-group">
      <div class="detail-label">Objects</div>
      <div class="detail-value">${objects}</div>
    </div>
    <div class="detail-group">
      <div class="detail-label">Downloads</div>
      <div class="detail-value">${downloads}</div>
    </div>
    <div class="detail-group">
      <div class="detail-label">Status</div>
      <div class="detail-value">
        ${isCompleted ? 
          '<span style="color: var(--success);"><i class="fas fa-check-circle"></i> Completed</span>' : 
          '<span style="color: var(--text-muted);"><i class="far fa-circle"></i> Not Completed</span>'
        }
      </div>
    </div>
    <div class="detail-group">
      <div class="detail-label">Favorite</div>
      <div class="detail-value">
        ${isFavorite ? 
          '<span style="color: var(--primary);"><i class="fas fa-heart"></i> Favorited</span>' : 
          '<span style="color: var(--text-muted);"><i class="far fa-heart"></i> Not Favorited</span>'
        }
      </div>
    </div>
    <div class="detail-group" style="grid-column: 1 / -1;">
      <div class="detail-label">Description</div>
      <div class="detail-value">${description}</div>
    </div>
    <div class="detail-group" style="grid-column: 1 / -1;">
      <div class="detail-label">Tags</div>
      <div class="detail-value">
        ${tags.map(tag => `<span class="filter-tag">${tag}</span>`).join(' ')}
      </div>
    </div>
    <div class="detail-group">
      <div class="detail-label">Video</div>
      <div class="detail-value">
        ${videoId ? 
          `<a href="${videoUrl}" target="_blank">Watch on YouTube</a>` : 
          'No video available'
        }
      </div>
    </div>
  `;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function getCurrentRank(level) {
  // Determine which data to use based on current page
  let currentData;
  
  if (window.location.pathname.includes('pemonlist.html')) {
    currentData = PEMON_DATA;
  } else if (window.location.pathname.includes('impossiblelist.html')) {
    currentData = IMPOSSIBLE_DATA;
  } else {
    currentData = DEMON_DATA;
  }
  
  return currentData.indexOf(level) + 1;
}

function closeDetailsModalFn() {
  const modal = document.getElementById('detailsModal');
  if (!modal) return;
  
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// YouTube helpers
function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]{11}).*/;
  const match = url.match(regExp);
  return (match && match[1]) ? match[1] : null;
}

function getYouTubeThumbnail(videoId) {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

// Enhanced favorites functions
function toggleFavorite(id) {
  const index = FAVORITES.indexOf(id);
  
  if (index > -1) {
    FAVORITES.splice(index, 1);
    showToast('Removed from favorites', 'info');
  } else {
    FAVORITES.push(id);
    showToast('Added to favorites', 'success');
  }
  
  localStorage.setItem('favorites', JSON.stringify(FAVORITES));
  
  // Update user profile
  updateUserProfile();
  
  // Update UI
  const card = document.querySelector(`.demon-card[data-id="${id}"]`);
  if (card) {
    const favoriteBtn = card.querySelector('.card-favorite');
    favoriteBtn.classList.toggle('active');
  }
  
  // Check for collector achievement
  checkAchievements();
}

function showFavorites() {
  if (!FAVORITES.length) {
    showToast('No favorites yet', 'info');
    return;
  }
  
  // Determine which data to use based on current page
  let currentData;
  
  if (window.location.pathname.includes('pemonlist.html')) {
    currentData = PEMON_DATA;
  } else if (window.location.pathname.includes('impossiblelist.html')) {
    currentData = IMPOSSIBLE_DATA;
  } else {
    currentData = DEMON_DATA;
  }
  
  const favoritesData = currentData.filter(demon => {
    const id = demon['ID Level'] || demon['ID'] || '';
    return FAVORITES.includes(id);
  });
  
  FILTERED_DATA = favoritesData;
  CURRENT_PAGE = 1;
  
  // Update UI
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  
  document.querySelectorAll('#difficultyMenu .filter-option').forEach(opt => {
    opt.classList.remove('active');
    if (opt.dataset.value === 'all') opt.classList.add('active');
  });
  
  const difficultyFilter = document.getElementById('difficultyFilter');
  if (difficultyFilter) {
    const span = difficultyFilter.querySelector('span');
    if (span) span.textContent = 'Difficulty';
  }
  
  CURRENT_FILTER = 'all';
  
  renderCards();
  renderPagination();
  
  // Close sidebar
  const sidebar = document.getElementById('sidebarNav');
  if (sidebar) sidebar.classList.remove('active');
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  showToast(`Showing ${favoritesData.length} favorite(s)`, 'success');
}

// Enhanced recently viewed functions
function addToRecentlyViewed(level) {
  const id = level['ID Level'] || level['ID'] || '';
  
  // Remove if already exists
  const index = RECENTLY_VIEWED.findIndex(item => {
    const itemId = item['ID Level'] || item['ID'] || '';
    return itemId === id;
  });
  
  if (index > -1) {
    RECENTLY_VIEWED.splice(index, 1);
  }
  
  // Add to beginning
  RECENTLY_VIEWED.unshift(level);
  
  // Keep only last 10
  if (RECENTLY_VIEWED.length > 10) {
    RECENTLY_VIEWED = RECENTLY_VIEWED.slice(0, 10);
  }
  
  localStorage.setItem('recentlyViewed', JSON.stringify(RECENTLY_VIEWED));
  
  // Check for achievements
  checkAchievements();
}

function showRecentlyViewed() {
  if (!RECENTLY_VIEWED.length) {
    showToast('No recently viewed levels', 'info');
    return;
  }
  
  FILTERED_DATA = RECENTLY_VIEWED;
  CURRENT_PAGE = 1;
  
  // Update UI
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  
  document.querySelectorAll('#difficultyMenu .filter-option').forEach(opt => {
    opt.classList.remove('active');
    if (opt.dataset.value === 'all') opt.classList.add('active');
  });
  
  const difficultyFilter = document.getElementById('difficultyFilter');
  if (difficultyFilter) {
    const span = difficultyFilter.querySelector('span');
    if (span) span.textContent = 'Difficulty';
  }
  
  CURRENT_FILTER = 'all';
  
  renderCards();
  renderPagination();
  
  // Close sidebar
  const sidebar = document.getElementById('sidebarNav');
  if (sidebar) sidebar.classList.remove('active');
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  showToast(`Showing ${RECENTLY_VIEWED.length} recently viewed level(s)`, 'success');
}

// Enhanced completed levels functions
function markAsCompleted(id) {
  const index = COMPLETED_LEVELS.indexOf(id);
  
  if (index > -1) {
    COMPLETED_LEVELS.splice(index, 1);
    showToast('Removed from completed levels', 'info');
  } else {
    COMPLETED_LEVELS.push(id);
    showToast('Marked as completed', 'success');
    
    // Award experience points
    USER_PROFILE.experience += 10;
    localStorage.setItem('userProfile', JSON.stringify(USER_PROFILE));
    updateUserProfile();
  }
  
  localStorage.setItem('completedLevels', JSON.stringify(COMPLETED_LEVELS));
  
  // Update user profile
  updateUserProfile();
  
  // Check for achievements
  checkAchievements();
  
  // Update UI
  renderCards();
}

// Enhanced random demon function
function showRandomDemon() {
  // Determine which data to use based on current page
  let currentData;
  let listType;
  
  if (window.location.pathname.includes('pemonlist.html')) {
    currentData = PEMON_DATA;
    listType = 'pemon';
  } else if (window.location.pathname.includes('impossiblelist.html')) {
    currentData = IMPOSSIBLE_DATA;
    listType = 'impossible';
  } else {
    currentData = DEMON_DATA;
    listType = 'demon';
  }
  
  if (!currentData.length) return;
  
  const randomIndex = Math.floor(Math.random() * currentData.length);
  const randomDemon = currentData[randomIndex];
  
  showLevelDetails(randomDemon);
  addToRecentlyViewed(randomDemon);
  
  const name = randomDemon['Level'] || randomDemon['Name'] || 'Unknown';
  showToast(`Showing random ${listType}: ${name}`, 'info');
}

// Enhanced compare functions
function toggleCompareMode() {
  if (SELECTED_FOR_COMPARE.length < 2) {
    showToast('Select at least 2 levels to compare', 'info');
    return;
  }
  
  // Create comparison modal
  createComparisonModal();
}

function addToCompare(level) {
  const id = level['ID Level'] || level['ID'] || '';
  const index = SELECTED_FOR_COMPARE.findIndex(item => {
    const itemId = item['ID Level'] || item['ID'] || '';
    return itemId === id;
  });
  
  if (index > -1) {
    SELECTED_FOR_COMPARE.splice(index, 1);
    showToast('Removed from comparison', 'info');
  } else {
    if (SELECTED_FOR_COMPARE.length >= 4) {
      showToast('You can compare up to 4 levels at a time', 'error');
      return;
    }
    SELECTED_FOR_COMPARE.push(level);
    showToast('Added to comparison', 'success');
  }
}

function createComparisonModal() {
  // Create modal if it doesn't exist
  let modal = document.getElementById('compareModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'compareModal';
    modal.className = 'modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const modalTitle = document.createElement('h3');
    modalTitle.className = 'modal-title';
    modalTitle.textContent = 'Compare Levels';
    
    const modalClose = document.createElement('button');
    modalClose.className = 'modal-close';
    modalClose.innerHTML = '<i class="fas fa-times"></i>';
    modalClose.addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    });
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(modalClose);
    
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    const comparisonContainer = document.createElement('div');
    comparisonContainer.className = 'comparison-container';
    comparisonContainer.id = 'comparisonContainer';
    
    modalBody.appendChild(comparisonContainer);
    
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    
    const closeModalBtn = document.createElement('button');
    closeModalBtn.className = 'modal-btn modal-btn-secondary';
    closeModalBtn.textContent = 'Close';
    closeModalBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    });
    
    const exportBtn = document.createElement('button');
    exportBtn.className = 'modal-btn modal-btn-primary';
    exportBtn.textContent = 'Export Comparison';
    exportBtn.addEventListener('click', exportComparison);
    
    modalFooter.appendChild(exportBtn);
    modalFooter.appendChild(closeModalBtn);
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal on background click
    modal.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
  
  // Populate comparison container
  const comparisonContainer = document.getElementById('comparisonContainer');
  if (!comparisonContainer) return;
  
  comparisonContainer.innerHTML = '';
  
  // Determine which data to use based on current page
  let currentData;
  
  if (window.location.pathname.includes('pemonlist.html')) {
    currentData = PEMON_DATA;
  } else if (window.location.pathname.includes('impossiblelist.html')) {
    currentData = IMPOSSIBLE_DATA;
  } else {
    currentData = DEMON_DATA;
  }
  
  SELECTED_FOR_COMPARE.forEach((level, index) => {
    const rank = currentData.indexOf(level) + 1;
    const name = level['Level'] || level['Name'] || 'Unknown';
    const id = level['ID Level'] || level['ID'] || '';
    const creator = level['Creators'] || level['Creator'] || 'Unknown';
    const verifier = level['Display Nickname'] || level['Verifier'] || creator;
    const difficultyColumn = level['Level Placement Opinion'] || level['Difficulty'] || 'Unknown';
    const difficulty = difficultyColumn.toLowerCase();
    const videoUrl = level['Video Link'] || level['Video'] || '';
    const videoId = getYouTubeId(videoUrl);
    const rating = level['Rating'] || 0;
    
    const comparisonCard = document.createElement('div');
    comparisonCard.className = 'comparison-card';
    
    comparisonCard.innerHTML = `
      <div class="comparison-header">
        <div class="comparison-rank">#${rank}</div>
        <div class="comparison-title">${name}</div>
      </div>
      <div class="comparison-details">
        <div class="comparison-detail">
          <div class="comparison-detail-label">Level ID</div>
          <div class="comparison-detail-value">${id}</div>
        </div>
        <div class="comparison-detail">
          <div class="comparison-detail-label">Creator</div>
          <div class="comparison-detail-value">${creator}</div>
        </div>
        <div class="comparison-detail">
          <div class="comparison-detail-label">Verifier</div>
          <div class="comparison-detail-value">${verifier}</div>
        </div>
        <div class="comparison-detail">
          <div class="comparison-detail-label">Difficulty</div>
          <div class="comparison-detail-value">
            <span class="diff-pill ${difficulty}">${difficultyColumn}</span>
          </div>
        </div>
        <div class="comparison-detail">
          <div class="comparison-detail-label">Rating</div>
          <div class="comparison-detail-value">
            ${generateStarRating(rating)}
          </div>
        </div>
        <div class="comparison-detail">
          <div class="comparison-detail-label">Video</div>
          <div class="comparison-detail-value">
            ${videoId ? 
              `<a href="${videoUrl}" target="_blank">Watch</a>` : 
              'No video'
            }
          </div>
        </div>
      </div>
    `;
    
    comparisonContainer.appendChild(comparisonCard);
  });
  
  // Show modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function exportComparison() {
  const data = SELECTED_FOR_COMPARE.map(level => ({
    name: level['Level'] || level['Name'],
    id: level['ID Level'] || level['ID'],
    creator: level['Creators'] || level['Creator'],
    verifier: level['Display Nickname'] || level['Verifier'],
    difficulty: level['Level Placement Opinion'] || level['Difficulty'],
    rating: level['Rating']
  }));
  
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'level-comparison.json';
  a.click();
  
  URL.revokeObjectURL(url);
  showToast('Comparison exported successfully', 'success');
}

// Enhanced advanced filters
function toggleAdvancedFilters() {
  const advancedFilterSection = document.getElementById('advancedFilterSection');
  if (!advancedFilterSection) return;
  
  advancedFilterSection.classList.toggle('active');
}

function applyAdvancedFilters() {
  const minRating = document.getElementById('minRating')?.value || 0;
  const maxRating = document.getElementById('maxRating')?.value || 5;
  const creatorFilter = document.getElementById('creatorFilter')?.value || '';
  const verifierFilter = document.getElementById('verifierFilter')?.value || '';
  const hasVideo = document.getElementById('hasVideo')?.checked || false;
  const completedFilter = document.getElementById('completedFilter')?.value || 'all';
  const tagFilter = document.getElementById('tagFilter')?.value || '';
  
  // Determine which data to use based on current page
  let currentData;
  
  if (window.location.pathname.includes('pemonlist.html')) {
    currentData = PEMON_DATA;
  } else if (window.location.pathname.includes('impossiblelist.html')) {
    currentData = IMPOSSIBLE_DATA;
  } else {
    currentData = DEMON_DATA;
  }
  
  // Apply filters
  FILTERED_DATA = currentData.filter(row => {
    const rating = parseFloat(row['Rating']) || 0;
    const creator = row['Creators'] || row['Creator'] || '';
    const verifier = row['Display Nickname'] || row['Verifier'] || '';
    const videoUrl = row['Video Link'] || row['Video'] || '';
        const id = row['ID Level'] || row['ID'] || '';
    const isCompleted = COMPLETED_LEVELS.includes(id);
    const tags = row['Tags'] ? row['Tags'].split(',').map(tag => tag.trim()) : [];
    
    if (rating < minRating || rating > maxRating) return false;
    if (creatorFilter && !creator.toLowerCase().includes(creatorFilter.toLowerCase())) return false;
    if (verifierFilter && !verifier.toLowerCase().includes(verifierFilter.toLowerCase())) return false;
    if (hasVideo && !videoUrl) return false;
    if (completedFilter === 'completed' && !isCompleted) return false;
    if (completedFilter === 'not-completed' && isCompleted) return false;
    if (tagFilter && !tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase()))) return false;
    
    return true;
  });
  
  CURRENT_PAGE = 1;
  renderCards();
  renderPagination();
  
  // Close advanced filters
  const advancedFilterSection = document.getElementById('advancedFilterSection');
  if (advancedFilterSection) advancedFilterSection.classList.remove('active');
  
  showToast(`Applied advanced filters. Found ${FILTERED_DATA.length} levels.`, 'success');
}

function resetAdvancedFilters() {
  const minRating = document.getElementById('minRating');
  const maxRating = document.getElementById('maxRating');
  const creatorFilter = document.getElementById('creatorFilter');
  const verifierFilter = document.getElementById('verifierFilter');
  const hasVideo = document.getElementById('hasVideo');
  const completedFilter = document.getElementById('completedFilter');
  const tagFilter = document.getElementById('tagFilter');
  
  if (minRating) minRating.value = 0;
  if (maxRating) maxRating.value = 5;
  if (creatorFilter) creatorFilter.value = '';
  if (verifierFilter) verifierFilter.value = '';
  if (hasVideo) hasVideo.checked = false;
  if (completedFilter) completedFilter.value = 'all';
  if (tagFilter) tagFilter.value = '';
  
  // Reset to default filters
  // Determine which data to use based on current page
  let currentData;
  
  if (window.location.pathname.includes('pemonlist.html')) {
    currentData = PEMON_DATA;
  } else if (window.location.pathname.includes('impossiblelist.html')) {
    currentData = IMPOSSIBLE_DATA;
  } else {
    currentData = DEMON_DATA;
  }
  
  FILTERED_DATA = [...currentData];
  CURRENT_PAGE = 1;
  renderCards();
  renderPagination();
  
  // Close advanced filters
  const advancedFilterSection = document.getElementById('advancedFilterSection');
  if (advancedFilterSection) advancedFilterSection.classList.remove('active');
  
  showToast('Filters reset', 'info');
}

function updateRangeValue(e) {
  const rangeInput = e.target;
  const rangeValue = rangeInput.parentElement.querySelector('.range-value');
  if (rangeValue) {
    rangeValue.textContent = rangeInput.value;
  }
}

// Enhanced user profile functions
function updateUserProfile() {
  const completedCount = COMPLETED_LEVELS.length;
  const favoriteCount = FAVORITES.length;
  
  USER_PROFILE.completedCount = completedCount;
  USER_PROFILE.favoriteCount = favoriteCount;
  
  // Calculate level based on experience
  USER_PROFILE.level = Math.floor(USER_PROFILE.experience / 100) + 1;
  
  localStorage.setItem('userProfile', JSON.stringify(USER_PROFILE));
  
  // Update UI if profile section exists
  const profileSection = document.getElementById('userProfileSection');
  if (profileSection) {
    const completedCountEl = profileSection.querySelector('.user-stat:nth-child(1) span');
    const favoriteCountEl = profileSection.querySelector('.user-stat:nth-child(2) span');
    const levelEl = profileSection.querySelector('.user-level');
    const expEl = profileSection.querySelector('.user-experience');
    
    if (completedCountEl) completedCountEl.textContent = completedCount;
    if (favoriteCountEl) favoriteCountEl.textContent = favoriteCount;
    if (levelEl) levelEl.textContent = `Level ${USER_PROFILE.level}`;
    if (expEl) expEl.textContent = `${USER_PROFILE.experience} XP`;
  }
}

// Achievement system
function checkAchievements() {
  Object.values(ACHIEVEMENTS).forEach(achievement => {
    if (!USER_ACHIEVEMENTS.includes(achievement.id) && achievement.condition()) {
      unlockAchievement(achievement);
    }
  });
}

function unlockAchievement(achievement) {
  USER_ACHIEVEMENTS.push(achievement.id);
  localStorage.setItem('achievements', JSON.stringify(USER_ACHIEVEMENTS));
  
  showAchievementPopup(achievement);
  showToast(`Achievement Unlocked: ${achievement.title}!`, 'success');
}

function showAchievementPopup(achievement) {
  const popup = document.createElement('div');
  popup.className = 'achievement-popup';
  popup.innerHTML = `
    <div class="achievement-icon">
      <i class="fas ${achievement.icon}"></i>
    </div>
    <div class="achievement-title">${achievement.title}</div>
    <div class="achievement-description">${achievement.description}</div>
    <button class="achievement-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i> Close
    </button>
  `;
  
  document.body.appendChild(popup);
  
  // Auto-close after 5 seconds
  setTimeout(() => {
    if (popup.parentElement) {
      popup.remove();
    }
  }, 5000);
}

// Tag filtering
function filterByTag(tag) {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = tag;
    handleSearch();
  }
}

// Enhanced share functionality
function shareLevel(level) {
  const name = level['Level'] || level['Name'] || 'Unknown Level';
  const id = level['ID Level'] || level['ID'] || '';
  const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
  
  if (navigator.share) {
    navigator.share({
      title: name,
      text: `Check out this level: ${name}`,
      url: url
    }).then(() => {
      showToast('Level shared successfully', 'success');
    }).catch(err => {
      console.error('Error sharing:', err);
      copyToClipboard(url);
    });
  } else {
    copyToClipboard(url);
  }
}

function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  
  try {
    document.execCommand('copy');
    showToast('Link copied to clipboard', 'success');
  } catch (err) {
    console.error('Failed to copy:', err);
    showToast('Failed to copy link', 'error');
  }
  
  document.body.removeChild(textarea);
}

// Infinite scroll functionality
function handleInfiniteScroll() {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
    loadMoreItems();
  }
}

function loadMoreItems() {
  const totalPages = Math.ceil(FILTERED_DATA.length / ITEMS_PER_PAGE);
  if (CURRENT_PAGE < totalPages) {
    CURRENT_PAGE++;
    renderCards();
    renderPagination();
  }
}

// Real-time updates
function startRealTimeUpdates() {
  // Check for updates every 5 minutes
  setInterval(checkForUpdates, 5 * 60 * 1000);
}

function checkForUpdates() {
  const lastUpdate = localStorage.getItem('lastDataUpdate');
  if (!lastUpdate) return;
  
  const timeSinceUpdate = Date.now() - new Date(lastUpdate).getTime();
  const hoursSinceUpdate = timeSinceUpdate / (1000 * 60 * 60);
  
  if (hoursSinceUpdate > 1) {
    showUpdateNotification();
  }
}

function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <div class="update-content">
      <i class="fas fa-sync-alt"></i>
      <span>New data available!</span>
      <button id="refreshBtn">Refresh</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Add animation
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Add event listener to refresh button
  document.getElementById('refreshBtn').addEventListener('click', () => {
    localStorage.removeItem('cachedDemonData');
    location.reload();
  });
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 10000);
}

// User preferences
function loadUserPreferences() {
  const savedViewMode = localStorage.getItem('viewMode');
  if (savedViewMode) {
    setViewMode(savedViewMode);
  }
  
  const savedPageSize = localStorage.getItem('pageSize');
  if (savedPageSize) {
    // Update page size if needed
  const itemsPerPageSelect = document.getElementById('itemsPerPage');
    if (itemsPerPageSelect) {
      itemsPerPageSelect.value = savedPageSize;
    }
  }
}

// Utility functions
function generateStarRating(rating) {
  let stars = '<div class="rating-stars">';
  
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars += '<i class="fas fa-star"></i>';
    } else {
      stars += '<i class="far fa-star"></i>';
    }
  }
  
  stars += '</div>';
  stars += `<span class="rating-value">${rating}/5</span>`;
  
  return stars;
}

// Theme functions
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
  
  showToast(`Switched to ${newTheme} mode`, 'info');
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('#themeToggle i');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}

// Reset filters function
function resetFilters() {
  CURRENT_FILTER = 'all';
  CURRENT_SORT = 'rank';
  CURRENT_PAGE = 1;
  
  // Reset UI
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  
  document.querySelectorAll('#difficultyMenu .filter-option').forEach(opt => {
    opt.classList.remove('active');
    if (opt.dataset.value === 'all') opt.classList.add('active');
  });
  
  document.querySelectorAll('#sortMenu .filter-option').forEach(opt => {
    opt.classList.remove('active');
    if (opt.dataset.value === 'rank') opt.classList.add('active');
  });
  
  const difficultyFilter = document.getElementById('difficultyFilter');
  const sortFilter = document.getElementById('sortFilter');
  
  if (difficultyFilter) {
    const span = difficultyFilter.querySelector('span');
    if (span) span.textContent = 'Difficulty';
  }
  
  if (sortFilter) {
    const span = sortFilter.querySelector('span');
    if (span) span.textContent = 'Rank';
  }
  
  // Reset advanced filters
  resetAdvancedFilters();
  
  // Re-apply filters
  applyFiltersAndSort();
}

// Lazy loading setup
function setupLazyLoading() {
  const images = document.querySelectorAll('.card-thumb');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  }
}

// Performance utilities
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Toast notification with enhanced styling
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '';
  switch (type) {
    case 'success':
      icon = 'fa-check-circle';
      break;
    case 'error':
      icon = 'fa-exclamation-circle';
      break;
    case 'warning':
      icon = 'fa-exclamation-triangle';
      break;
    case 'info':
    default:
      icon = 'fa-info-circle';
      break;
  }
  
  toast.innerHTML = `
    <i class="fas ${icon}"></i>
    <span>${message}</span>
  `;
  
  toastContainer.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Keyboard navigation
function setupKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    // Number keys for quick page navigation
    if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey) {
      const pageNum = parseInt(e.key);
      const totalPages = Math.ceil(FILTERED_DATA.length / ITEMS_PER_PAGE);
      
      if (pageNum <= totalPages) {
        CURRENT_PAGE = pageNum;
        renderCards();
        renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    
    // Arrow keys for card navigation
    if (e.key === 'ArrowLeft' && CURRENT_PAGE > 1) {
      CURRENT_PAGE--;
      renderCards();
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    if (e.key === 'ArrowRight') {
      const totalPages = Math.ceil(FILTERED_DATA.length / ITEMS_PER_PAGE);
      if (CURRENT_PAGE < totalPages) {
        CURRENT_PAGE++;
        renderCards();
        renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  });
}

// Initialize keyboard navigation
setupKeyboardNavigation();

// Export data functionality
function exportData() {
  const data = FILTERED_DATA.map(level => ({
    name: level['Level'] || level['Name'],
    id: level['ID Level'] || level['ID'],
    creator: level['Creators'] || level['Creator'],
    verifier: level['Display Nickname'] || level['Verifier'],
    difficulty: level['Level Placement Opinion'] || level['Difficulty'],
    rating: level['Rating'],
    tags: level['Tags'],
    video: level['Video Link'] || level['Video']
  }));
  
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'frgdps-levels.csv';
  a.click();
  
  URL.revokeObjectURL(url);
  showToast('Data exported successfully', 'success');
}

function convertToCSV(data) {
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => `"${row[header] || ''}"`).join(',')
  );
  
  return csvHeaders + '\n' + csvRows.join('\n');
}

// Search suggestions
function setupSearchSuggestions() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  
  const suggestionsContainer = document.createElement('div');
  suggestionsContainer.className = 'search-suggestions';
  suggestionsContainer.style.display = 'none';
  
  searchInput.parentElement.appendChild(suggestionsContainer);
  
  searchInput.addEventListener('focus', () => {
    showSearchSuggestions();
  });
  
  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      suggestionsContainer.style.display = 'none';
    }, 200);
  });
  
  searchInput.addEventListener('input', (e) => {
    if (e.target.value.length > 2) {
      updateSearchSuggestions(e.target.value);
    } else {
      suggestionsContainer.style.display = 'none';
    }
  });
}

function showSearchSuggestions() {
  const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
  const suggestionsContainer = document.querySelector('.search-suggestions');
  
  if (history.length > 0) {
    suggestionsContainer.innerHTML = history.slice(0, 5).map(term => 
      `<div class="suggestion-item" onclick="selectSuggestion('${term}')">${term}</div>`
    ).join('');
    suggestionsContainer.style.display = 'block';
  }
}

function updateSearchSuggestions(query) {
  const suggestionsContainer = document.querySelector('.search-suggestions');
  const currentData = getCurrentData();
  
  const suggestions = currentData
    .filter(level => {
      const name = (level['Level'] || level['Name'] || '').toLowerCase();
      const creator = (level['Creators'] || level['Creator'] || '').toLowerCase();
      return name.includes(query.toLowerCase()) || creator.includes(query.toLowerCase());
    })
    .slice(0, 5)
    .map(level => level['Level'] || level['Name']);
  
  if (suggestions.length > 0) {
    suggestionsContainer.innerHTML = suggestions.map(suggestion => 
      `<div class="suggestion-item" onclick="selectSuggestion('${suggestion}')">${suggestion}</div>`
    ).join('');
    suggestionsContainer.style.display = 'block';
  } else {
    suggestionsContainer.style.display = 'none';
  }
}

function selectSuggestion(term) {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = term;
    handleSearch();
  }
  
  const suggestionsContainer = document.querySelector('.search-suggestions');
  if (suggestionsContainer) {
    suggestionsContainer.style.display = 'none';
  }
}

function getCurrentData() {
  if (window.location.pathname.includes('pemonlist.html')) {
    return PEMON_DATA;
  } else if (window.location.pathname.includes('impossiblelist.html')) {
    return IMPOSSIBLE_DATA;
  } else {
    return DEMON_DATA;
  }
}

// Initialize search suggestions
setupSearchSuggestions();

// Add CSS for search suggestions
const searchSuggestionsCSS = `
.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--surface);
  border: 1px solid var(--surface-light);
  border-top: none;
  border-radius: 0 0 var(--radius) var(--radius);
  box-shadow: var(--shadow);
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 0.8rem 1rem;
  cursor: pointer;
  transition: var(--transition);
  border-bottom: 1px solid var(--surface-light);
}

.suggestion-item:hover {
  background: var(--surface-light);
  color: var(--primary);
}

.suggestion-item:last-child {
  border-bottom: none;
}
`;

const searchStyleSheet = document.createElement('style');
searchStyleSheet.textContent = searchSuggestionsCSS;
document.head.appendChild(searchStyleSheet);

// Print functionality
function setupPrintFunctionality() {
  const printBtn = document.createElement('button');
  printBtn.className = 'action-btn';
  printBtn.innerHTML = '<i class="fas fa-print"></i> Print List';
  printBtn.addEventListener('click', printCurrentView);
  
  const controlsSection = document.querySelector('.controls-section .action-buttons');
  if (controlsSection) {
    controlsSection.appendChild(printBtn);
  }
}

function printCurrentView() {
  window.print();
}

// Add print styles
const printStyles = `
@media print {
  .sidebar, .header-actions, .controls-section, .pagination, .toast-container {
    display: none !important;
  }
  
  .demon-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 1rem !important;
  }
  
  .demon-card {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  
  .page-header {
    margin-bottom: 1rem;
  }
}
`;

const printStyleSheet = document.createElement('style');
printStyleSheet.textContent = printStyles;
document.head.appendChild(printStyleSheet);

// Initialize print functionality
setupPrintFunctionality();

// Analytics tracking (optional)
function trackEvent(eventName, properties = {}) {
  // This is a placeholder for analytics integration
  console.log('Event tracked:', eventName, properties);
  
  // Example integration with Google Analytics or other service
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, properties);
  }
}

// Track page views
trackEvent('page_view', {
  page_title: document.title,
  page_location: window.location.href
});

// Track user interactions
document.addEventListener('click', (e) => {
  if (e.target.closest('.demon-card')) {
    trackEvent('card_click', {
      element: 'demon_card'
    });
  }
  
  if (e.target.closest('.favorite-btn')) {
    trackEvent('favorite_toggle', {
      element: 'favorite_button'
    });
  }
});

// Performance monitoring
function monitorPerformance() {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
        console.log('Page load time:', loadTime + 'ms');
        
        // Track slow loads
        if (loadTime > 3000) {
          trackEvent('slow_load', {
            load_time: loadTime
          });
        }
      }
    });
  }
}

// Initialize performance monitoring
monitorPerformance();

// Service Worker for offline support
const swCode = `
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('frgdps-v1').then(cache => {
      return cache.addAll([
        '/',
        '/styles.css',
        '/script.js',
        '/index.html',
        '/pemonlist.html',
        '/impossiblelist.html',
        '/info.html'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
`;

// Register service worker
if ('serviceWorker' in navigator) {
  const blob = new Blob([swCode], { type: 'application/javascript' });
  const swUrl = URL.createObjectURL(blob);
  
  navigator.serviceWorker.register(swUrl)
    .then(registration => {
      console.log('Service Worker registered');
    })
    .catch(err => {
      console.log('Service Worker registration failed:', err);
    });
}
