/**
 * FrGDPS Demon List - Enhanced JavaScript
 * A comprehensive demon list viewer with filtering, sorting, and user profiles
 */

// Module pattern for better organization
const DemonListApp = (() => {
  // Private variables
  let demonData = [];
  let pemonData = [];
  let impossibleData = [];
  let filteredData = [];
  let favorites = [];
  let recentlyViewed = [];
  let completedLevels = [];
  let userAchievements = [];
  let currentPage = 1;
  const ITEMS_PER_PAGE = 12;
  let currentSort = 'rank';
  let currentFilter = 'all';
  let viewMode = 'grid';
  let selectedForCompare = [];
  let userProfile = {
    username: 'Guest',
    avatar: null,
    completedCount: 0,
    favoriteCount: 0,
    level: 1,
    experience: 0
  };
  
  // Data sources configuration
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
      condition: () => recentlyViewed.length >= 1
    },
    explorer: {
      id: 'explorer',
      title: 'Explorer',
      description: 'View 10 different levels',
      icon: 'fa-compass',
      condition: () => recentlyViewed.length >= 10
    },
    collector: {
      id: 'collector',
      title: 'Collector',
      description: 'Add 5 levels to favorites',
      icon: 'fa-heart',
      condition: () => favorites.length >= 5
    },
    completer: {
      id: 'completer',
      title: 'Demon Slayer',
      description: 'Complete 3 levels',
      icon: 'fa-skull',
      condition: () => completedLevels.length >= 3
    },
    master: {
      id: 'master',
      title: 'Demon Master',
      description: 'Complete 10 levels',
      icon: 'fa-crown',
      condition: () => completedLevels.length >= 10
    },
    reviewer: {
      id: 'reviewer',
      title: 'Critic',
      description: 'Rate 5 levels',
      icon: 'fa-star',
      condition: () => userProfile.experience >= 50
    }
  };
  
  // DOM element references
  const elements = {};
  
  // Initialize the app
  function init() {
    cacheElements();
    loadUserData();
    initializeEventListeners();
    loadData();
    checkAchievements();
    updateYear();
    initializeTheme();
    setupServiceWorker();
  }
  
  // Cache DOM elements for better performance
  function cacheElements() {
    elements.cardGrid = document.getElementById('demonCardGrid');
    elements.loadingMsg = document.getElementById('loadingMsg');
    elements.searchInput = document.getElementById('searchInput');
    elements.difficultyMenu = document.getElementById('difficultyMenu');
    elements.sortMenu = document.getElementById('sortMenu');
    elements.pagination = document.getElementById('pagination');
    elements.sidebar = document.getElementById('sidebarNav');
    elements.toastContainer = document.getElementById('toastContainer');
    elements.videoModal = document.getElementById('videoModal');
    elements.detailsModal = document.getElementById('detailsModal');
    elements.compareModal = document.getElementById('compareModal');
    elements.advancedFilterSection = document.getElementById('advancedFilterSection');
  }
  
  // Load user data from localStorage
  function loadUserData() {
    favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
    completedLevels = JSON.parse(localStorage.getItem('completedLevels')) || [];
    userAchievements = JSON.parse(localStorage.getItem('achievements')) || [];
    userProfile = JSON.parse(localStorage.getItem('userProfile')) || userProfile;
    viewMode = localStorage.getItem('viewMode') || 'grid';
  }
  
  // Initialize event listeners
  function initializeEventListeners() {
    // Sidebar navigation
    setupSidebarListeners();
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Search functionality
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Filter menus
    setupFilterListeners();
    
    // View controls
    setupViewControls();
    
    // Action buttons
    setupActionButtons();
    
    // Modal controls
    setupModalControls();
    
    // Keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Advanced filters
    setupAdvancedFilters();
    
    // Infinite scroll
    window.addEventListener('scroll', throttle(handleInfiniteScroll, 200));
    
    // Print functionality
    setupPrintFunctionality();
  }
  
  // Setup sidebar listeners
  function setupSidebarListeners() {
    const openSidebarBtn = document.getElementById('openSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');
    
    if (openSidebarBtn && closeSidebarBtn) {
      openSidebarBtn.onclick = () => elements.sidebar.classList.add('active');
      closeSidebarBtn.onclick = () => elements.sidebar.classList.remove('active');
      
      // Close sidebar on click outside
      document.addEventListener('click', (e) => {
        if (
          elements.sidebar.classList.contains('active') &&
          !elements.sidebar.contains(e.target) &&
          e.target !== openSidebarBtn && !openSidebarBtn.contains(e.target)
        ) elements.sidebar.classList.remove('active');
      });
    }
    
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
  }
  
  // Setup filter listeners
  function setupFilterListeners() {
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
  }
  
  // Setup view controls
  function setupViewControls() {
    const gridView = document.getElementById('gridView');
    const listView = document.getElementById('listView');
    
    if (gridView) {
      gridView.addEventListener('click', () => setViewMode('grid'));
    }
    
    if (listView) {
      listView.addEventListener('click', () => setViewMode('list'));
    }
  }
  
  // Setup action buttons
  function setupActionButtons() {
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
  }
  
  // Setup modal controls
  function setupModalControls() {
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
    if (elements.videoModal) {
      elements.videoModal.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeVideoModalFn();
      });
    }
    
    if (elements.detailsModal) {
      elements.detailsModal.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeDetailsModalFn();
      });
    }
  }
  
  // Setup keyboard shortcuts
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeVideoModalFn();
        closeDetailsModalFn();
      }
      
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (elements.searchInput) elements.searchInput.focus();
      }
      
      // Ctrl/Cmd + F for favorites
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        showFavorites();
      }
      
      // Number keys for quick page navigation
      if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey) {
        const pageNum = parseInt(e.key);
        const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
        
        if (pageNum <= totalPages) {
          currentPage = pageNum;
          renderCards();
          renderPagination();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      
      // Arrow keys for card navigation
      if (e.key === 'ArrowLeft' && currentPage > 1) {
        currentPage--;
        renderCards();
        renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
      if (e.key === 'ArrowRight') {
        const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
        if (currentPage < totalPages) {
          currentPage++;
          renderCards();
          renderPagination();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });
  }
  
  // Setup advanced filters
  function setupAdvancedFilters() {
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
  }
  
  // Setup print functionality
  function setupPrintFunctionality() {
    const printBtn = document.createElement('button');
    printBtn.className = 'action-btn';
    printBtn.innerHTML = '<i class="fas fa-print"></i> Print List';
    printBtn.addEventListener('click', () => window.print());
    
    const controlsSection = document.querySelector('.controls-section .action-buttons');
    if (controlsSection) {
      controlsSection.appendChild(printBtn);
    }
  }
  
  // Update current year in footer
  function updateYear() {
    const currentYear = new Date().getFullYear();
    const yearElements = document.querySelectorAll('#year, #footerYear');
    yearElements.forEach(el => {
      if (el) el.textContent = currentYear;
    });
  }
  
  // Initialize theme
  function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }
  
  // Setup service worker for offline support
  function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('Service worker registration failed:', err);
      });
    }
  }
  
  // Data loading with enhanced error handling
  async function loadData() {
    if (!elements.cardGrid) return;
    
    // Show skeleton loading
    elements.cardGrid.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      elements.cardGrid.appendChild(createSkeletonCard());
    }
    
    try {
      // Determine which data source to use based on current page
      let dataSource;
      let dataVariable;
      
      if (window.location.pathname.includes('pemonlist.html')) {
        dataSource = DATA_SOURCES.pemonlist;
        dataVariable = 'pemonData';
      } else if (window.location.pathname.includes('impossiblelist.html')) {
        dataSource = DATA_SOURCES.impossiblelist;
        dataVariable = 'impossibleData';
      } else {
        dataSource = DATA_SOURCES.demonlist;
        dataVariable = 'demonData';
      }
      
      // Load data with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(dataSource, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const csvText = await response.text();
      const parsedData = await parseCSV(csvText);
      
      const validData = parsedData.filter(r => {
        const levelName = r.Level || r.Name || '';
        return levelName.trim() !== '';
      });
      
      if (validData.length === 0) {
        throw new Error('No valid data found');
      }
      
      // Store data in appropriate variable
      if (dataVariable === 'pemonData') {
        pemonData = validData;
        filteredData = [...validData];
      } else if (dataVariable === 'impossibleData') {
        impossibleData = validData;
        filteredData = [...validData];
      } else {
        demonData = validData;
        filteredData = [...validData];
      }
      
      // Cache data for offline use
      localStorage.setItem('cachedDemonData', JSON.stringify(validData));
      localStorage.setItem('lastDataUpdate', new Date().toISOString());
      
      // Apply filters and render
      applyFiltersAndSort();
      updateStats();
      
      if (elements.loadingMsg) elements.loadingMsg.style.display = 'none';
      
      // Show success message
      const listType = dataVariable === 'pemonData' ? 'Pemon' : 
                      dataVariable === 'impossibleData' ? 'Impossible' : 'Demon';
      showToast(`Loaded ${validData.length} ${listType} levels`, 'success');
      
      // Start real-time updates check
      startRealTimeUpdates();
    } catch (error) {
      handleDataError(error);
    }
  }
  
  // Parse CSV data
  function parseCSV(csvText) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        complete: results => resolve(results.data),
        error: reject
      });
    });
  }
  
  // Handle data loading errors
  function handleDataError(error) {
    console.error('Data loading error:', error);
    
    if (!elements.cardGrid) return;
    
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
          <button class="action-btn" onclick="DemonListApp.retryLoading()">
            <i class="fas fa-redo"></i> Retry
          </button>
          <button class="action-btn" onclick="DemonListApp.loadCachedData()">
            <i class="fas fa-database"></i> Use Cached Data
          </button>
          <button class="action-btn" onclick="DemonListApp.loadSampleData()">
            <i class="fas fa-flask"></i> Load Sample Data
          </button>
        </div>
      </div>
    `;
    
    elements.cardGrid.innerHTML = '';
    elements.cardGrid.appendChild(errorDiv);
    
    // Hide loading message
    if (elements.loadingMsg) elements.loadingMsg.style.display = 'none';
    
    showToast('Failed to load data from Google Sheets', 'error');
  }
  
  // Retry loading data
  function retryLoading() {
    location.reload();
  }
  
  // Load cached data
  function loadCachedData() {
    const cachedData = localStorage.getItem('cachedDemonData');
    
    if (cachedData) {
      try {
        const data = JSON.parse(cachedData);
        
        // Determine which data to use based on current page
        if (window.location.pathname.includes('pemonlist.html')) {
          pemonData = data;
          filteredData = [...data];
        } else if (window.location.pathname.includes('impossiblelist.html')) {
          impossibleData = data;
          filteredData = [...data];
        } else {
          demonData = data;
          filteredData = [...data];
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
  
  // Load sample data for testing
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
      pemonData = sampleData;
      filteredData = [...sampleData];
    } else if (window.location.pathname.includes('impossiblelist.html')) {
      impossibleData = sampleData;
      filteredData = [...sampleData];
    } else {
      demonData = sampleData;
      filteredData = [...sampleData];
    }
    
    applyFiltersAndSort();
    updateStats();
    showToast('Loaded sample data for testing', 'info');
  }
  
  // Create skeleton loading card
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
  
  // Update statistics
  function updateStats() {
    const totalDemons = document.getElementById('totalDemons');
    const extremeDemons = document.getElementById('extremeDemons');
    const lastUpdated = document.getElementById('lastUpdated');
    
    // Determine which data to use based on current page
    let currentData;
    let listType;
    
    if (window.location.pathname.includes('pemonlist.html')) {
      currentData = pemonData;
      listType = 'Pemons';
    } else if (window.location.pathname.includes('impossiblelist.html')) {
      currentData = impossibleData;
      listType = 'Impossible';
    } else {
      currentData = demonData;
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
  
  // Animate number counting
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
  
  // Format date
  function formatDate(d) {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  
  // Search functionality
  function handleSearch() {
    if (!elements.searchInput) return;
    
    const term = elements.searchInput.value.trim().toLowerCase();
    currentPage = 1;
    
    // Add search to history
    addToSearchHistory(term);
    
    applyFiltersAndSort();
  }
  
  // Add search term to history
  function addToSearchHistory(term) {
    if (!term) return;
    
    let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    history = history.filter(h => h !== term);
    history.unshift(term);
    history = history.slice(0, 10); // Keep only last 10 searches
    localStorage.setItem('searchHistory', JSON.stringify(history));
  }
  
  // Toggle difficulty menu
  function toggleDifficultyMenu() {
    if (!elements.difficultyMenu) return;
    
    elements.difficultyMenu.classList.toggle('active');
    
    // Close sort menu if open
    if (elements.sortMenu) elements.sortMenu.classList.remove('active');
  }
  
  // Toggle sort menu
  function toggleSortMenu() {
    if (!elements.sortMenu) return;
    
    elements.sortMenu.classList.toggle('active');
    
    // Close difficulty menu if open
    if (elements.difficultyMenu) elements.difficultyMenu.classList.remove('active');
  }
  
  // Handle difficulty filter
  function handleDifficultyFilter(option) {
    // Update active state
    document.querySelectorAll('#difficultyMenu .filter-option').forEach(opt => {
      opt.classList.remove('active');
    });
    option.classList.add('active');
    
    // Update filter
    currentFilter = option.dataset.value;
    currentPage = 1;
    
    // Update button text
    const difficultyFilter = document.getElementById('difficultyFilter');
    if (difficultyFilter) {
      const span = difficultyFilter.querySelector('span');
      if (span) {
        span.textContent = option.dataset.value === 'all' ? 'Difficulty' : option.textContent;
      }
    }
    
    // Close menu
    if (elements.difficultyMenu) elements.difficultyMenu.classList.remove('active');
    
    // Apply filter
    applyFiltersAndSort();
  }
  
  // Handle sort filter
  function handleSortFilter(option) {
    // Update active state
    document.querySelectorAll('#sortMenu .filter-option').forEach(opt => {
      opt.classList.remove('active');
    });
    option.classList.add('active');
    
    // Update sort
    currentSort = option.dataset.value;
    currentPage = 1;
    
    // Update button text
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
      const span = sortFilter.querySelector('span');
      if (span) {
        span.textContent = option.textContent;
      }
    }
    
    // Close menu
    if (elements.sortMenu) elements.sortMenu.classList.remove('active');
    
    // Apply sort
    applyFiltersAndSort();
  }
  
  // Apply filters and sort
  function applyFiltersAndSort() {
    const searchTerm = elements.searchInput ? elements.searchInput.value.trim().toLowerCase() : '';
    
    // Determine which data to use based on current page
    let currentData;
    
    if (window.location.pathname.includes('pemonlist.html')) {
      currentData = pemonData;
    } else if (window.location.pathname.includes('impossiblelist.html')) {
      currentData = impossibleData;
    } else {
      currentData = demonData;
    }
    
    // Apply search filter
    filteredData = currentData.filter(row => {
      if (searchTerm && !Object.values(row).join(' ').toLowerCase().includes(searchTerm)) {
        return false;
      }
      
      if (currentFilter !== 'all') {
        // Handle different column names for different lists
        const difficultyColumn = row['Level Placement Opinion'] || row['Difficulty'] || '';
        const difficulty = difficultyColumn.toLowerCase();
        if (difficulty !== currentFilter) {
          return false;
        }
      }
      
      return true;
    });
    
    // Apply sort
    filteredData.sort((a, b) => {
      switch (currentSort) {
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
  
  // Set view mode
  function setViewMode(mode) {
    viewMode = mode;
    const grid = elements.cardGrid;
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
  
  // Render cards
  function renderCards() {
    if (!elements.cardGrid) return;
    
    elements.cardGrid.innerHTML = '';
    
    if (!filteredData.length) {
      elements.cardGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); margin-top: 2rem; padding: 2rem;">
          <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
          <h3>No levels found</h3>
          <p>Try adjusting your search or filters</p>
          <button class="action-btn" onclick="DemonListApp.resetFilters()" style="margin-top: 1rem;">
            <i class="fas fa-redo"></i> Reset Filters
          </button>
        </div>
      `;
      return;
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    // Render cards for current page
    pageData.forEach((row, index) => {
      const globalIndex = startIndex + index + 1;
      const card = createDemonCard(row, globalIndex);
      elements.cardGrid.appendChild(card);
    });
    
    // Add intersection observer for lazy loading
    setupLazyLoading();
  }
  
  // Create demon card
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
    const isFavorite = favorites.includes(id);
    const isCompleted = completedLevels.includes(id);
    
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
  
  // Render pagination
  function renderPagination() {
    if (!elements.pagination) return;
    
    elements.pagination.innerHTML = '';
    
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    
    if (totalPages <= 1) return;
    
    // First button
    const firstBtn = document.createElement('button');
    firstBtn.className = 'page-btn';
    firstBtn.innerHTML = '<i class="fas fa-angle-double-left"></i>';
    firstBtn.disabled = currentPage === 1;
    firstBtn.addEventListener('click', () => {
      currentPage = 1;
      renderCards();
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    elements.pagination.appendChild(firstBtn);
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderCards();
        renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
    elements.pagination.appendChild(prevBtn);
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', () => {
        currentPage = i;
        renderCards();
        renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      elements.pagination.appendChild(pageBtn);
    }
    
    // Page info
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    elements.pagination.appendChild(pageInfo);
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderCards();
        renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
    elements.pagination.appendChild(nextBtn);
    
    // Last button
    const lastBtn = document.createElement('button');
    lastBtn.className = 'page-btn';
    lastBtn.innerHTML = '<i class="fas fa-angle-double-right"></i>';
    lastBtn.disabled = currentPage === totalPages;
    lastBtn.addEventListener('click', () => {
      currentPage = totalPages;
      renderCards();
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    elements.pagination.appendChild(lastBtn);
  }
  
  // Open video modal
  function openModal(videoId) {
    const youtubeFrame = document.getElementById('youtubeFrame');
    
    if (!elements.videoModal || !youtubeFrame) return;
    
    youtubeFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    elements.videoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Add to viewing history
    const viewingHistory = JSON.parse(localStorage.getItem('viewingHistory')) || [];
    viewingHistory.unshift({ videoId, timestamp: Date.now() });
    localStorage.setItem('viewingHistory', JSON.stringify(viewingHistory.slice(0, 50)));
  }
  
  // Close video modal
  function closeVideoModalFn() {
    const youtubeFrame = document.getElementById('youtubeFrame');
    
    if (!elements.videoModal || !youtubeFrame) return;
    
    elements.videoModal.classList.remove('active');
    youtubeFrame.src = '';
    document.body.style.overflow = '';
  }
  
  // Show level details
  function showLevelDetails(level) {
    const modalTitle = document.getElementById('detailsModalTitle');
    const levelDetails = document.getElementById('levelDetails');
    const watchVideoBtn = document.getElementById('watchVideo');
    
    if (!elements.detailsModal || !modalTitle || !levelDetails) return;
    
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
    
    const isCompleted = completedLevels.includes(id);
    const isFavorite = favorites.includes(id);
    
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
    
    elements.detailsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  // Get current rank of a level
  function getCurrentRank(level) {
    // Determine which data to use based on current page
    let currentData;
    
    if (window.location.pathname.includes('pemonlist.html')) {
      currentData = pemonData;
    } else if (window.location.pathname.includes('impossiblelist.html')) {
      currentData = impossibleData;
    } else {
      currentData = demonData;
    }
    
    return currentData.indexOf(level) + 1;
  }
  
  // Close details modal
  function closeDetailsModalFn() {
    if (!elements.detailsModal) return;
    
    elements.detailsModal.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  // Get YouTube video ID from URL
  function getYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]{11}).*/;
    const match = url.match(regExp);
    return (match && match[1]) ? match[1] : null;
  }
  
  // Get YouTube thumbnail URL
  function getYouTubeThumbnail(videoId) {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
  
  // Toggle favorite status
  function toggleFavorite(id) {
    const index = favorites.indexOf(id);
    
    if (index > -1) {
      favorites.splice(index, 1);
      showToast('Removed from favorites', 'info');
    } else {
      favorites.push(id);
      showToast('Added to favorites', 'success');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
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
  
  // Show favorites
  function showFavorites() {
    if (!favorites.length) {
      showToast('No favorites yet', 'info');
      return;
    }
    
    // Determine which data to use based on current page
    let currentData;
    
    if (window.location.pathname.includes('pemonlist.html')) {
      currentData = pemonData;
    } else if (window.location.pathname.includes('impossiblelist.html')) {
      currentData = impossibleData;
    } else {
      currentData = demonData;
    }
    
    const favoritesData = currentData.filter(demon => {
      const id = demon['ID Level'] || demon['ID'] || '';
      return favorites.includes(id);
    });
    
    filteredData = favoritesData;
    currentPage = 1;
    
    // Update UI
    if (elements.searchInput) elements.searchInput.value = '';
    
    document.querySelectorAll('#difficultyMenu .filter-option').forEach(opt => {
      opt.classList.remove('active');
      if (opt.dataset.value === 'all') opt.classList.add('active');
    });
    
    const difficultyFilter = document.getElementById('difficultyFilter');
    if (difficultyFilter) {
      const span = difficultyFilter.querySelector('span');
      if (span) span.textContent = 'Difficulty';
    }
    
    currentFilter = 'all';
    
    renderCards();
    renderPagination();
    
    // Close sidebar
    if (elements.sidebar) elements.sidebar.classList.remove('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    showToast(`Showing ${favoritesData.length} favorite(s)`, 'success');
  }
  
  // Add to recently viewed
  function addToRecentlyViewed(level) {
    const id = level['ID Level'] || level['ID'] || '';
    
    // Remove if already exists
    const index = recentlyViewed.findIndex(item => {
      const itemId = item['ID Level'] || item['ID'] || '';
      return itemId === id;
    });
    
    if (index > -1) {
      recentlyViewed.splice(index, 1);
    }
    
    // Add to beginning
    recentlyViewed.unshift(level);
    
    // Keep only last 10
    if (recentlyViewed.length > 10) {
      recentlyViewed = recentlyViewed.slice(0, 10);
    }
    
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    
    // Check for achievements
    checkAchievements();
  }
  
  // Show recently viewed
  function showRecentlyViewed() {
    if (!recentlyViewed.length) {
      showToast('No recently viewed levels', 'info');
      return;
    }
    
    filteredData = recentlyViewed;
    currentPage = 1;
    
    // Update UI
    if (elements.searchInput) elements.searchInput.value = '';
    
    document.querySelectorAll('#difficultyMenu .filter-option').forEach(opt => {
      opt.classList.remove('active');
      if (opt.dataset.value === 'all') opt.classList.add('active');
    });
    
    const difficultyFilter = document.getElementById('difficultyFilter');
    if (difficultyFilter) {
      const span = difficultyFilter.querySelector('span');
      if (span) span.textContent = 'Difficulty';
    }
    
    currentFilter = 'all';
    
    renderCards();
    renderPagination();
    
    // Close sidebar
    if (elements.sidebar) elements.sidebar.classList.remove('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    showToast(`Showing ${recentlyViewed.length} recently viewed level(s)`, 'success');
  }
  
  // Mark level as completed
  function markAsCompleted(id) {
    const index = completedLevels.indexOf(id);
    
    if (index > -1) {
      completedLevels.splice(index, 1);
      showToast('Removed from completed levels', 'info');
    } else {
      completedLevels.push(id);
      showToast('Marked as completed', 'success');
      
      // Award experience points
      userProfile.experience += 10;
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      updateUserProfile();
    }
    
    localStorage.setItem('completedLevels', JSON.stringify(completedLevels));
    
    // Update user profile
    updateUserProfile();
    
    // Check for achievements
    checkAchievements();
    
    // Update UI
    renderCards();
  }
  
  // Show random demon
  function showRandomDemon() {
    // Determine which data to use based on current page
    let currentData;
    let listType;
    
    if (window.location.pathname.includes('pemonlist.html')) {
      currentData = pemonData;
      listType = 'pemon';
    } else if (window.location.pathname.includes('impossiblelist.html')) {
      currentData = impossibleData;
      listType = 'impossible';
    } else {
      currentData = demonData;
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
  
  // Toggle compare mode
  function toggleCompareMode() {
    if (selectedForCompare.length < 2) {
      showToast('Select at least 2 levels to compare', 'info');
      return;
    }
    
    // Create comparison modal
    createComparisonModal();
  }
  
  // Add to comparison
  function addToCompare(level) {
    const id = level['ID Level'] || level['ID'] || '';
    const index = selectedForCompare.findIndex(item => {
      const itemId = item['ID Level'] || item['ID'] || '';
      return itemId === id;
    });
    
    if (index > -1) {
      selectedForCompare.splice(index, 1);
      showToast('Removed from comparison', 'info');
    } else {
      if (selectedForCompare.length >= 4) {
        showToast('You can compare up to 4 levels at a time', 'error');
        return;
      }
      selectedForCompare.push(level);
      showToast('Added to comparison', 'success');
    }
  }
  
  // Create comparison modal
  function createComparisonModal() {
    // Create modal if it doesn't exist
    let modal = elements.compareModal;
    
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
      
      elements.compareModal = modal;
    }
    
    // Populate comparison container
    const comparisonContainer = document.getElementById('comparisonContainer');
    if (!comparisonContainer) return;
    
    comparisonContainer.innerHTML = '';
    
    // Determine which data to use based on current page
    let currentData;
    
    if (window.location.pathname.includes('pemonlist.html')) {
      currentData = pemonData;
    } else if (window.location.pathname.includes('impossiblelist.html')) {
      currentData = impossibleData;
    } else {
      currentData = demonData;
    }
    
    selectedForCompare.forEach((level, index) => {
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
  
  // Export comparison data
  function exportComparison() {
    const data = selectedForCompare.map(level => ({
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
  
  // Toggle advanced filters
  function toggleAdvancedFilters() {
    if (!elements.advancedFilterSection) return;
    
    elements.advancedFilterSection.classList.toggle('active');
  }
  
  // Apply advanced filters
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
      currentData = pemonData;
    } else if (window.location.pathname.includes('impossiblelist.html')) {
      currentData = impossibleData;
    } else {
      currentData = demonData;
    }
    
    // Apply filters
    filteredData = currentData.filter(row => {
      const rating = parseFloat(row['Rating']) || 0;
      const creator = row['Creators'] || row['Creator'] || '';
      const verifier = row['Display Nickname'] || row['Verifier'] || '';
      const videoUrl = row['Video Link'] || row['Video'] || '';
      const id = row['ID Level'] || row['ID'] || '';
      const isCompleted = completedLevels.includes(id);
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
    
    currentPage = 1;
    renderCards();
    renderPagination();
    
    // Close advanced filters
    if (elements.advancedFilterSection) elements.advancedFilterSection.classList.remove('active');
    
    showToast(`Applied advanced filters. Found ${filteredData.length} levels.`, 'success');
  }
  
  // Reset advanced filters
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
      currentData = pemonData;
    } else if (window.location.pathname.includes('impossiblelist.html')) {
      currentData = impossibleData;
    } else {
      currentData = demonData;
    }
    
    filteredData = [...currentData];
    currentPage = 1;
    renderCards();
    renderPagination();
    
    // Close advanced filters
    if (elements.advancedFilterSection) elements.advancedFilterSection.classList.remove('active');
    
    showToast('Filters reset', 'info');
  }
  
  // Update range value display
  function updateRangeValue(e) {
    const rangeInput = e.target;
    const rangeValue = rangeInput.parentElement.querySelector('.range-value');
    if (rangeValue) {
      rangeValue.textContent = rangeInput.value;
    }
  }
  
  // Update user profile
  function updateUserProfile() {
    const completedCount = completedLevels.length;
    const favoriteCount = favorites.length;
    
    userProfile.completedCount = completedCount;
    userProfile.favoriteCount = favoriteCount;
    
    // Calculate level based on experience
    userProfile.level = Math.floor(userProfile.experience / 100) + 1;
    
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    
    // Update UI if profile section exists
    const profileSection = document.getElementById('userProfileSection');
    if (profileSection) {
      const completedCountEl = profileSection.querySelector('.user-stat:nth-child(1) span');
      const favoriteCountEl = profileSection.querySelector('.user-stat:nth-child(2) span');
      const levelEl = profileSection.querySelector('.user-level');
      const expEl = profileSection.querySelector('.user-experience');
      
      if (completedCountEl) completedCountEl.textContent = completedCount;
      if (favoriteCountEl) favoriteCountEl.textContent = favoriteCount;
      if (levelEl) levelEl.textContent = `Level ${userProfile.level}`;
      if (expEl) expEl.textContent = `${userProfile.experience} XP`;
    }
  }
  
  // Check for achievements
  function checkAchievements() {
    Object.values(ACHIEVEMENTS).forEach(achievement => {
      if (!userAchievements.includes(achievement.id) && achievement.condition()) {
        unlockAchievement(achievement);
      }
    });
  }
  
  // Unlock achievement
  function unlockAchievement(achievement) {
    userAchievements.push(achievement.id);
    localStorage.setItem('achievements', JSON.stringify(userAchievements));
    
    showAchievementPopup(achievement);
    showToast(`Achievement Unlocked: ${achievement.title}!`, 'success');
  }
  
  // Show achievement popup
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
  
  // Filter by tag
  function filterByTag(tag) {
    if (elements.searchInput) {
      elements.searchInput.value = tag;
      handleSearch();
    }
  }
  
  // Share level
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
  
  // Copy to clipboard
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
  
  // Handle infinite scroll
  function handleInfiniteScroll() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
      loadMoreItems();
    }
  }
  
  // Load more items for infinite scroll
  function loadMoreItems() {
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    if (currentPage < totalPages) {
      currentPage++;
      renderCards();
      renderPagination();
    }
  }
  
  // Start real-time updates check
  function startRealTimeUpdates() {
    // Check for updates every 5 minutes
    setInterval(checkForUpdates, 5 * 60 * 1000);
  }
  
  // Check for updates
  function checkForUpdates() {
    const lastUpdate = localStorage.getItem('lastDataUpdate');
    if (!lastUpdate) return;
    
    const timeSinceUpdate = Date.now() - new Date(lastUpdate).getTime();
    const hoursSinceUpdate = timeSinceUpdate / (1000 * 60 * 60);
    
    if (hoursSinceUpdate > 1) {
      showUpdateNotification();
    }
  }
  
  // Show update notification
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
  
  // Generate star rating HTML
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
  
  // Toggle theme
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    showToast(`Switched to ${newTheme} mode`, 'info');
  }
  
  // Update theme icon
  function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
      icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }
  
  // Reset filters
  function resetFilters() {
    currentFilter = 'all';
    currentSort = 'rank';
    currentPage = 1;
    
    // Reset UI
    if (elements.searchInput) elements.searchInput.value = '';
    
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
  
  // Setup lazy loading for images
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
  
  // Show toast notification
  function showToast(message, type = 'info') {
    if (!elements.toastContainer) return;
    
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
    
    elements.toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  // Utility functions
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
  
  // Public API
  return {
    init,
    retryLoading,
    loadCachedData,
    loadSampleData,
    resetFilters
  };
})();

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  DemonListApp.init();
});
