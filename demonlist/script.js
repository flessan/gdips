/**
 * GDIPS Demon List - Enhanced JavaScript
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
  let userRatings = {};
  let levelProgress = {};
  let searchHistory = [];
  let communityReviews = {};
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
    experience: 0,
    joinDate: new Date().toISOString()
  };
  
  // Data sources configuration - Fixed URLs
  const DATA_SOURCES = {
    demonlist: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSDN7HUdFLEi7P5CkSFXFz_b16Os_8hdEItayViA0TfNze8nudO6sxlJgL9h2K8gkYMQah6RS1KXvL2/pub?gid=1550981254&single=true&output=csv',
    pemonlist: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRULqi0QRDR6gfQo8P2bfqpcqnnZJSkD1ZT-D2XiF7urmzvLwcf10L85KSVp20q65AkMjsha6Lg2LIQ/pub?gid=0&single=true&output=csv',
    impossiblelist: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4iVSl1wTRfOZwLAoyZF-ej_Be2LCgtpXnHgswXbZJczu1EXvrWsGvffpPtAtWxx6-XlOcGsgaHDLo/pub?gid=0&single=true&output=csv'
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
      condition: () => Object.keys(userRatings).length >= 5
    },
    progressTracker: {
      id: 'progressTracker',
      title: 'Progress Tracker',
      description: 'Track progress on 5 levels',
      icon: 'fa-chart-line',
      condition: () => Object.keys(levelProgress).length >= 5
    },
    communityMember: {
      id: 'communityMember',
      title: 'Community Member',
      description: 'Write 3 reviews',
      icon: 'fa-comments',
      condition: () => Object.values(communityReviews).flat().length >= 3
    }
  };
  
  // DOM element references
  const elements = {};
  
  // Initialize app
  function init() {
    cacheElements();
    loadUserData();
    initializeEventListeners();
    loadData();
    checkAchievements();
    updateYear();
    initializeTheme();
    setupServiceWorker();
    setupSearchSuggestions();
    setupRecommendationEngine();
    initializeTabs();
  }
  
  // Initialize tabs functionality
  function initializeTabs() {
    const tabNav = document.querySelector('.tab-nav');
    if (!tabNav) return;
    
    // Add click listeners to tab items
    const tabItems = tabNav.querySelectorAll('.tab-nav-item');
    tabItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all tabs
        tabItems.forEach(tab => tab.classList.remove('active'));
        
        // Add active class to clicked tab
        item.classList.add('active');
        
        // Get the target page from href
        const href = item.getAttribute('href');
        if (href) {
          // Navigate to the page
          window.location.href = href;
        }
      });
    });
    
    // Set active tab based on current page
    const currentPath = window.location.pathname;
    tabItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href && currentPath.includes(href)) {
        item.classList.add('active');
      }
    });
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
    elements.ratingModal = document.getElementById('ratingModal');
    elements.statisticsModal = document.getElementById('statisticsModal');
    elements.reviewsModal = document.getElementById('reviewsModal');
    elements.progressModal = document.getElementById('progressModal');
    elements.searchSuggestions = document.getElementById('searchSuggestions');
  }
  
  // Load user data from localStorage
  function loadUserData() {
    favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
    completedLevels = JSON.parse(localStorage.getItem('completedLevels')) || [];
    userAchievements = JSON.parse(localStorage.getItem('achievements')) || [];
    userProfile = JSON.parse(localStorage.getItem('userProfile')) || userProfile;
    viewMode = localStorage.getItem('viewMode') || 'grid';
    userRatings = JSON.parse(localStorage.getItem('userRatings')) || {};
    levelProgress = JSON.parse(localStorage.getItem('levelProgress')) || {};
    searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
    communityReviews = JSON.parse(localStorage.getItem('communityReviews')) || {};
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
      elements.searchInput.addEventListener('focus', showSearchSuggestions);
      elements.searchInput.addEventListener('blur', hideSearchSuggestions);
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
    
    // Infinite scroll with proper scroll handling
    setupInfiniteScroll();
    
    // Print functionality
    setupPrintFunctionality();
  }
  
  // Setup infinite scroll with proper handling
  function setupInfiniteScroll() {
    let isLoading = false;
    let hasMoreContent = true;
    
    window.addEventListener('scroll', throttle(() => {
      if (isLoading || !hasMoreContent) return;
      
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const threshold = documentHeight - 1000;
      
      if (scrollPosition >= threshold) {
        loadMoreItems();
      }
    }, 200));
    
    function loadMoreItems() {
      const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
      if (currentPage >= totalPages) {
        hasMoreContent = false;
        return;
      }
      
      isLoading = true;
      currentPage++;
      
      // Show loading indicator
      showLoadingIndicator();
      
      // Simulate loading delay for better UX
      setTimeout(() => {
        renderCards();
        renderPagination();
        hideLoadingIndicator();
        isLoading = false;
      }, 300);
    }
  }
  
  // Show loading indicator
  function showLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'scrollLoader';
    indicator.className = 'scroll-loader';
    indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading more...';
    indicator.style.cssText = `
      text-align: center;
      padding: 1rem;
      color: var(--text-muted);
      grid-column: 1 / -1;
    `;
    
    if (elements.cardGrid) {
      elements.cardGrid.appendChild(indicator);
    }
  }
  
  // Hide loading indicator
  function hideLoadingIndicator() {
    const indicator = document.getElementById('scrollLoader');
    if (indicator) {
      indicator.remove();
    }
  }
  
  // Get current data source based on page
  function getCurrentDataSource() {
    if (window.location.pathname.includes('pemonlist.html')) {
      return { data: pemonData, source: 'pemonlist', type: 'Pemon' };
    } else if (window.location.pathname.includes('impossiblelist.html')) {
      return { data: impossibleData, source: 'impossiblelist', type: 'Impossible' };
    } else {
      return { data: demonData, source: 'demonlist', type: 'Demon' };
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
      // Check if Papa Parse is available
      if (typeof Papa === 'undefined') {
        throw new Error('Papa Parse library is not loaded');
      }
      
      // Get current data source
      const { source, type } = getCurrentDataSource();
      const dataSource = DATA_SOURCES[source];
      
      // Load data with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(dataSource, { 
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const csvText = await response.text();
      const parsedData = await parseCSV(csvText);
      
      // Enhanced data validation
      const validData = parsedData.filter(row => {
        const levelName = row.Level || row.Name || '';
        const levelId = row['ID Level'] || row.ID || '';
        return levelName.trim() !== '' && levelId.trim() !== '';
      });
      
      if (validData.length === 0) {
        throw new Error('No valid data found');
      }
      
      // Process and store data
      const processedData = validData.map((row, index) => ({
        ...row,
        rank: index + 1,
        processed: true
      }));
      
      // Store data in appropriate variable
      if (source === 'pemonlist') {
        pemonData = processedData;
        filteredData = [...processedData];
      } else if (source === 'impossiblelist') {
        impossibleData = processedData;
        filteredData = [...processedData];
      } else {
        demonData = processedData;
        filteredData = [...processedData];
      }
      
      // Cache data for offline use
      localStorage.setItem(`cached${type}Data`, JSON.stringify(processedData));
      localStorage.setItem('lastDataUpdate', new Date().toISOString());
      
      // Apply filters and render
      applyFiltersAndSort();
      updateStats();
      
      if (elements.loadingMsg) elements.loadingMsg.style.display = 'none';
      
      showToast(`Loaded ${processedData.length} ${type} levels`, 'success');
      
      // Start real-time updates check
      startRealTimeUpdates();
    } catch (error) {
      console.error('Data loading error:', error);
      handleDataError(error);
    }
  }
  
  // Parse CSV data with better error handling
  function parseCSV(csvText) {
    return new Promise((resolve, reject) => {
      if (!csvText || csvText.trim() === '') {
        reject(new Error('Empty CSV data'));
        return;
      }
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => header.trim(),
        transform: (value, field) => {
          // Clean up data
          if (typeof value === 'string') {
            return value.trim();
          }
          return value;
        },
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          resolve(results.data);
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }
  
  // Handle data loading errors with better recovery
  function handleDataError(error) {
    console.error('Data loading error:', error);
    
    if (!elements.cardGrid) return;
    
    // Try to load cached data first
    const { type } = getCurrentDataSource();
    const cachedData = localStorage.getItem(`cached${type}Data`);
    
    if (cachedData) {
      try {
        const data = JSON.parse(cachedData);
        
        if (source === 'pemonlist') {
          pemonData = data;
          filteredData = [...data];
        } else if (source === 'impossiblelist') {
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
        }
        
        if (elements.loadingMsg) elements.loadingMsg.style.display = 'none';
        return;
      } catch (e) {
        console.error('Error parsing cached data:', e);
      }
    }
    
    // Show error message with retry options
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-container';
    errorDiv.innerHTML = `
      <div class="error-content">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Unable to Load Data</h3>
        <p>${error.message || 'We are having trouble loading level data.'}</p>
        <p>This might be due to:</p>
        <ul>
          <li>Network connectivity issues</li>
          <li>Google Sheets being temporarily unavailable</li>
          <li>Changes in data structure</li>
          <li>CORS restrictions</li>
          <li>Missing Papa Parse library</li>
        </ul>
        <div class="error-actions">
          <button class="action-btn" onclick="DemonListApp.retryLoading()">
            <i class="fas fa-redo"></i> Retry
          </button>
          <button class="action-btn" onclick="DemonListApp.loadSampleData()">
            <i class="fas fa-flask"></i> Load Sample Data
          </button>
        </div>
      </div>
    `;
    
    elements.cardGrid.innerHTML = '';
    elements.cardGrid.appendChild(errorDiv);
    
    if (elements.loadingMsg) elements.loadingMsg.style.display = 'none';
    
    showToast('Failed to load data', 'error');
  }
  
  // Apply filters and sort with better performance
  function applyFiltersAndSort() {
    const searchTerm = elements.searchInput ? elements.searchInput.value.trim().toLowerCase() : '';
    const { data: currentData } = getCurrentDataSource();
    
    if (!currentData || currentData.length === 0) {
      filteredData = [];
      renderCards();
      renderPagination();
      return;
    }
    
    // Apply search filter
    filteredData = currentData.filter(row => {
      // Search filter
      if (searchTerm) {
        const searchableText = [
          row.Level || row.Name || '',
          row.Creators || row.Creator || '',
          row['Display Nickname'] || row.Verifier || '',
          row.Tags || '',
          row.Description || ''
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }
      
      // Difficulty filter
      if (currentFilter !== 'all') {
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
          const aName = (a.Level || a.Name || '').toLowerCase();
          const bName = (b.Level || b.Name || '').toLowerCase();
          return aName.localeCompare(bName);
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3, insane: 4, extreme: 5, impossible: 6 };
          const aDiffColumn = a['Level Placement Opinion'] || a['Difficulty'] || '';
          const bDiffColumn = b['Level Placement Opinion'] || b['Difficulty'] || '';
          const aDiff = aDiffColumn.toLowerCase();
          const bDiff = bDiffColumn.toLowerCase();
          return difficultyOrder[aDiff] - difficultyOrder[bDiff];
        case 'creator':
          const aCreator = (a.Creators || a['Creator'] || '').toLowerCase();
          const bCreator = (b.Creators || b['Creator'] || '').toLowerCase();
          return aCreator.localeCompare(bCreator);
        case 'rating':
          const aRating = parseFloat(a.Rating) || 0;
          const bRating = parseFloat(b.Rating) || 0;
          return bRating - aRating;
        case 'rank':
        default:
          // Keep original order (rank)
          return (a.rank || 0) - (b.rank || 0);
      }
    });
    
    // Render
    renderCards();
    renderPagination();
  }
  
  // Render cards with better performance
  function renderCards() {
    if (!elements.cardGrid) return;
    
    // Clear previous content
    elements.cardGrid.innerHTML = '';
    
    if (!filteredData || filteredData.length === 0) {
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
    
    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Render cards for current page
    pageData.forEach((row, index) => {
      const globalIndex = startIndex + index + 1;
      const card = createDemonCard(row, globalIndex);
      fragment.appendChild(card);
    });
    
    // Append all cards at once
    elements.cardGrid.appendChild(fragment);
    
    // Setup lazy loading after cards are rendered
    requestAnimationFrame(() => {
      setupLazyLoading();
    });
  }
  
  // Create demon card with better data handling
  function createDemonCard(row, rank) {
    // Extract data with fallbacks
    const name = row.Level || row.Name || 'Unknown Level';
    const id = row['ID Level'] || row.ID || '';
    const creator = row.Creators || row.Creator || 'Unknown';
    const verifier = row['Display Nickname'] || row.Verifier || creator;
    const videoUrl = row['Video Link'] || row.Video || '';
    const difficultyColumn = row['Level Placement Opinion'] || row.Difficulty || 'Unknown';
    const difficulty = difficultyColumn.toLowerCase();
    const rating = parseFloat(row.Rating) || 0;
    const tags = row.Tags ? row.Tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    const description = row.Description || '';
    const length = row.Length || 'Unknown';
    const objects = row.Objects || 'Unknown';
    const downloads = row.Downloads || '0';
    
    const videoId = getYouTubeId(videoUrl);
    const isFavorite = favorites.includes(id);
    const isCompleted = completedLevels.includes(id);
    const userRating = userRatings[id] || 0;
    const progress = levelProgress[id] || 0;
    
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
    
    // Progress bar
    if (progress > 0 && !isCompleted) {
      const progressBar = document.createElement('div');
      progressBar.className = 'card-progress';
      progressBar.innerHTML = `
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <span class="progress-text">${progress}%</span>
      `;
      card.appendChild(progressBar);
    }
    
    // Thumbnail
    if (videoId) {
      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'card-thumb-wrap';
      
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
      thumb.addEventListener('error', () => {
        thumb.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMjIyNjMyIi8+CjxwYXRoIGQ9Ik0xNjAgOTBMMTIwIDcwTDIwIDExMEwxNjAgOTBaIiBmaWxsPSIjNzc3Nzc3Ii8+Cjwvc3ZnPgo=';
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
    title.title = name; // Add tooltip for long names
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
      desc.title = description; // Full description on hover
      content.appendChild(desc);
    }
    
    // Diff/ID Row
    const infoRow = document.createElement('div');
    infoRow.className = 'level-info-row';
    
    const diffSpan = document.createElement('span');
    diffSpan.className = `diff-pill ${difficulty}`;
    diffSpan.textContent = difficultyColumn;
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
    if (rating > 0 || userRating > 0) {
      const ratingContainer = document.createElement('div');
      ratingContainer.className = 'rating-container';
      
      const ratingStars = document.createElement('div');
      ratingStars.className = 'rating-stars';
      
      // Use user rating if available, otherwise use default rating
      const displayRating = userRating > 0 ? userRating : rating;
      
      for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        star.className = i <= displayRating ? 'fas fa-star' : 'far fa-star';
        ratingStars.appendChild(star);
      }
      
      const ratingValue = document.createElement('div');
      ratingValue.className = 'rating-value';
      ratingValue.textContent = `${displayRating}/5`;
      
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
    
    const rateBtn = document.createElement('button');
    rateBtn.className = 'card-action-btn';
    rateBtn.innerHTML = '<i class="fas fa-star"></i> Rate';
    rateBtn.addEventListener('click', () => {
      showRatingModal(row);
    });
    actions.appendChild(rateBtn);
    
    const progressBtn = document.createElement('button');
    progressBtn.className = 'card-action-btn';
    progressBtn.innerHTML = '<i class="fas fa-chart-line"></i> Progress';
    progressBtn.addEventListener('click', () => {
      showProgressModal(row);
    });
    actions.appendChild(progressBtn);
    
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
  
  // Render pagination with better UX
  function renderPagination() {
    if (!elements.pagination) return;
    
    elements.pagination.innerHTML = '';
    
    if (!filteredData || filteredData.length === 0) return;
    
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    
    if (totalPages <= 1) return;
    
    // Create pagination controls
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-container';
    
    // First button
    const firstBtn = createPaginationButton('<<', () => {
      currentPage = 1;
      renderCards();
      renderPagination();
      scrollToTop();
    }, currentPage === 1);
    
    // Previous button
    const prevBtn = createPaginationButton('<', () => {
      if (currentPage > 1) {
        currentPage--;
        renderCards();
        renderPagination();
        scrollToTop();
      }
    }, currentPage === 1);
    
    paginationContainer.appendChild(firstBtn);
    paginationContainer.appendChild(prevBtn);
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
      paginationContainer.appendChild(createPaginationButton('1', () => {
        currentPage = 1;
        renderCards();
        renderPagination();
        scrollToTop();
      }));
      
      if (startPage > 2) {
        const dots = document.createElement('span');
        dots.className = 'pagination-dots';
        dots.textContent = '...';
        paginationContainer.appendChild(dots);
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = createPaginationButton(i.toString(), () => {
        currentPage = i;
        renderCards();
        renderPagination();
        scrollToTop();
      }, i === currentPage);
      
      paginationContainer.appendChild(pageBtn);
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const dots = document.createElement('span');
        dots.className = 'pagination-dots';
        dots.textContent = '...';
        paginationContainer.appendChild(dots);
      }
      
      paginationContainer.appendChild(createPaginationButton(totalPages.toString(), () => {
        currentPage = totalPages;
        renderCards();
        renderPagination();
        scrollToTop();
      }));
    }
    
    // Next button
    const nextBtn = createPaginationButton('>', () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderCards();
        renderPagination();
        scrollToTop();
      }
    }, currentPage === totalPages);
    
    // Last button
    const lastBtn = createPaginationButton('>>', () => {
      currentPage = totalPages;
      renderCards();
      renderPagination();
      scrollToTop();
    }, currentPage === totalPages);
    
    paginationContainer.appendChild(nextBtn);
    paginationContainer.appendChild(lastBtn);
    
    // Page info
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    paginationContainer.appendChild(pageInfo);
    
    elements.pagination.appendChild(paginationContainer);
  }
  
  // Create pagination button helper
  function createPaginationButton(text, onClick, disabled = false) {
    const button = document.createElement('button');
    button.className = `page-btn ${disabled ? 'disabled' : ''}`;
    button.textContent = text;
    button.disabled = disabled;
    
    if (!disabled) {
      button.addEventListener('click', onClick);
    }
    
    return button;
  }
  
  // Smooth scroll to top
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
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
  
  // Utility functions
  function formatDate(d) {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  
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
  
  // Placeholder functions for features not fully implemented
  function setupSidebarListeners() {
    // Implementation for sidebar listeners
  }
  
  function setupFilterListeners() {
    // Implementation for filter listeners
  }
  
  function setupViewControls() {
    // Implementation for view controls
  }
  
  function setupActionButtons() {
    // Implementation for action buttons
  }
  
  function setupModalControls() {
    // Implementation for modal controls
  }
  
  function setupKeyboardShortcuts() {
    // Implementation for keyboard shortcuts
  }
  
  function setupAdvancedFilters() {
    // Implementation for advanced filters
  }
  
  function setupPrintFunctionality() {
    // Implementation for print functionality
  }
  
  function setupSearchSuggestions() {
    // Implementation for search suggestions
  }
  
  function setupRecommendationEngine() {
    // Implementation for recommendation engine
  }
  
  function updateYear() {
    const currentYear = new Date().getFullYear();
    const yearElements = document.querySelectorAll('#year, #footerYear');
    yearElements.forEach(el => {
      if (el) el.textContent = currentYear;
    });
  }
  
  function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }
  
  function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('Service worker registration failed:', err);
      });
    }
  }
  
  function updateStats() {
    // Implementation for updating statistics
  }
  
  function checkAchievements() {
    // Implementation for checking achievements
  }
  
  function startRealTimeUpdates() {
    // Implementation for real-time updates
  }
  
  function setupLazyLoading() {
    // Implementation for lazy loading
  }
  
  function handleSearch() {
    currentPage = 1;
    applyFiltersAndSort();
  }
  
  function showSearchSuggestions() {
    // Implementation for showing search suggestions
  }
  
  function hideSearchSuggestions() {
    // Implementation for hiding search suggestions
  }
  
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    showToast(`Switched to ${newTheme} mode`, 'info');
  }
  
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
    renderCards();
  }
  
  function addToRecentlyViewed(level) {
    const id = level['ID Level'] || level['ID'] || '';
    const index = recentlyViewed.findIndex(item => {
      const itemId = item['ID Level'] || item['ID'] || '';
      return itemId === id;
    });
    
    if (index > -1) {
      recentlyViewed.splice(index, 1);
    }
    
    recentlyViewed.unshift(level);
    if (recentlyViewed.length > 10) {
      recentlyViewed = recentlyViewed.slice(0, 10);
    }
    
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
  }
  
  function markAsCompleted(id) {
    const index = completedLevels.indexOf(id);
    if (index > -1) {
      completedLevels.splice(index, 1);
      showToast('Removed from completed levels', 'info');
    } else {
      completedLevels.push(id);
      showToast('Marked as completed', 'success');
      userProfile.experience += 10;
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
    }
    localStorage.setItem('completedLevels', JSON.stringify(completedLevels));
    renderCards();
  }
  
  function showLevelDetails(level) {
    // Implementation for showing level details
    console.log('Show level details:', level);
  }
  
  function showRatingModal(level) {
    // Implementation for showing rating modal
    console.log('Show rating modal:', level);
  }
  
  function showProgressModal(level) {
    // Implementation for showing progress modal
    console.log('Show progress modal:', level);
  }
  
  function addToCompare(level) {
    // Implementation for adding to comparison
    console.log('Add to compare:', level);
  }
  
  function shareLevel(level) {
    // Implementation for sharing level
    console.log('Share level:', level);
  }
  
  function filterByTag(tag) {
    if (elements.searchInput) {
      elements.searchInput.value = tag;
      handleSearch();
    }
  }
  
  function openModal(videoId) {
    // Implementation for opening video modal
    console.log('Open modal with video:', videoId);
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
  
  // Public API
  return {
    init,
    retryLoading: () => location.reload(),
    loadCachedData: () => {
      const { type } = getCurrentDataSource();
      const cachedData = localStorage.getItem(`cached${type}Data`);
      if (cachedData) {
        loadData();
      } else {
        showToast('No cached data available', 'error');
      }
    },
    loadSampleData: () => {
      // Load sample data for testing
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
      
      const { source } = getCurrentDataSource();
      if (source === 'pemonlist') {
        pemonData = sampleData;
        filteredData = [...sampleData];
      } else if (source === 'impossiblelist') {
        impossibleData = sampleData;
        filteredData = [...sampleData];
      } else {
        demonData = sampleData;
        filteredData = [...sampleData];
      }
      
      applyFiltersAndSort();
      updateStats();
      showToast('Loaded sample data for testing', 'info');
    },
    resetFilters: () => {
      currentFilter = 'all';
      currentSort = 'rank';
      currentPage = 1;
      
      if (elements.searchInput) elements.searchInput.value = '';
      
      applyFiltersAndSort();
      showToast('Filters reset', 'info');
    }
  };
})();

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  DemonListApp.init();
});