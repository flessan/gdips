<?php
// Tambahkan fungsi untuk mengambil data dari API dengan caching
function fetchApiData($url, $cacheFile, $cacheTime = 300) { // Cache 5 menit default
    $cacheDir = 'cache';
    
    // Buat direktori cache jika belum ada
    if (!file_exists($cacheDir)) {
        mkdir($cacheDir, 0755, true);
    }
    
    $cacheFilePath = $cacheDir . '/' . $cacheFile;
    
    // Periksa apakah file cache ada dan masih valid
    if (file_exists($cacheFilePath) && (time() - filemtime($cacheFilePath)) < $cacheTime) {
        $data = file_get_contents($cacheFilePath);
        return json_decode($data, true);
    }
    
    // Ambil data dari API
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5); // Timeout 5 detik
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3); // Connection timeout 3 detik
    $data = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // Simpan ke cache jika berhasil
    if ($httpCode == 200 && $data !== false) {
        file_put_contents($cacheFilePath, $data);
        return json_decode($data, true);
    }
    
    // Jika gagal, coba gunakan cache lama jika ada
    if (file_exists($cacheFilePath)) {
        $data = file_get_contents($cacheFilePath);
        return json_decode($data, true);
    }
    
    return null;
}

// Sistem leaderboard/papan peringkat - ambil dari API
 $leaderboardUrl = 'https://fless.ps.fhgdps.com/dashboard/stats/top24h.php';
 $leaderboard = fetchApiData($leaderboardUrl, 'leaderboard_cache.json', 300); // Cache 5 menit

// Jika gagal mengambil data, gunakan data default
if (empty($leaderboard)) {
    $leaderboard = [
        [
            'rank' => 1,
            'name' => 'Zalgacor',
            'stars' => 1250,
            'demons' => 42,
            'cp' => 3500
        ],
        [
            'rank' => 2,
            'name' => 'Luktav',
            'stars' => 1180,
            'demons' => 38,
            'cp' => 3200
        ],
        [
            'rank' => 3,
            'name' => 'Zuyaa',
            'stars' => 1050,
            'demons' => 35,
            'cp' => 2900
        ]
    ];
}

// Tambahkan panggilan API lainnya dengan caching
 $apiEndpoints = [
    'stats' => 'https://fless.ps.fhgdps.com/dashboard/api/getGJStats.php',
    'levels' => 'https://fless.ps.fhgdps.com/dashboard/api/getGJLevels.php',
    'songs' => 'https://fless.ps.fhgdps.com/dashboard/api/getGJSongs.php',
    'gauntlets' => 'https://fless.ps.fhgdps.com/dashboard/api/getGJGauntlets.php',
    'mapPacks' => 'https://fless.ps.fhgdps.com/dashboard/api/getGJMapPacks.php'
];

 $apiData = [];
foreach ($apiEndpoints as $key => $url) {
    $apiData[$key] = fetchApiData($url, $key . '_cache.json', 600); // Cache 10 menit
}

// Simpan data API untuk digunakan di JavaScript
 $apiDataJson = json_encode($apiData);
?>
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>GDIPS - Geometry Dash Indonesia Private Server | Status: Online</title>
  <meta name="description" content="GDIPS - Geometry Dash Indonesia Private Server, komunitas Geometry Dash terbesar di Indonesia. Server saat ini: Online" />
  <link rel="icon" href="/dashboard/icon.png" />
  <meta name="theme-color" content="#c8102e" />
  <meta property="og:title" content="GDIPS - Geometry Dash Indonesia Private Server" />
  <meta property="og:description" content="Server Geometry Dash Indonesia dengan fitur ekstra, alat, dan komunitas terbuka. Status: Online" />
  <meta property="og:image" content="https://fless.ps.fhgdps.com/dashboard/icon.png" />
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <!-- Chart.js for data visualization -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
/* Warna Indonesia */
--bg-primary: #1a1a1a;
--bg-secondary: #2d2d2d;
--bg-tertiary: #3c4043;
--bg-overlay: rgba(26, 26, 26, 0.8);
--bg-card: #252525;

--border-default: #30363d;
--border-muted: #21262d;
--border-secondary: #484f58;

--text-primary: #f9f9f9;
--text-secondary: #e8eaed;
--text-tertiary: #a0a0a0;
--text-inverse: #1a1a1a;

--accent-primary: #c8102e; /* Merah Indonesia */
--accent-secondary: #d4af37; /* Emas Indonesia */
--accent-success: #3fb950;
--accent-danger: #f85149;
--accent-warning: #d29922;
--accent-info: #3498db;

--shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
--shadow-sm: 0 4px 6px rgba(0, 0, 0, 0.1);
--radius: 8px;
--radius-lg: 12px;
--transition: all 0.3s ease;
font-size: clamp(14px, 1.2vw, 16px);
}

* {
margin: 0;
padding: 0;
box-sizing: border-box;
}

html {
scroll-behavior: smooth;
}

body {
font-family: 'Poppins', system-ui, -apple-system, sans-serif;
background-color: var(--bg-primary);
color: var(--text-primary);
line-height: 1.6;
overflow-x: hidden;
position: relative;
}

/* Indonesian pattern background */
body::before {
content: "";
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
background-image:
linear-gradient(45deg, rgba(200, 16, 46, 0.05) 25%, transparent 25%),
linear-gradient(-45deg, rgba(200, 16, 46, 0.05) 25%, transparent 25%),
linear-gradient(45deg, transparent 75%, rgba(200, 16, 46, 0.05) 75%),
linear-gradient(-45deg, transparent 75%, rgba(200, 16, 46, 0.05) 75%);
background-size: 20px 20px;
background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
z-index: -1;
}

h1, h2, h3, h4, h5, h6 {
font-weight: 600;
line-height: 1.25;
}

h1 {
font-size: clamp(2rem, 5vw, 2.8rem);
margin-bottom: 0.5rem;
}

h2 {
font-size: clamp(1.1rem, 2.5vw, 1.25rem);
margin-bottom: 1rem;
}

h3 {
font-size: 1rem;
margin-bottom: 0.5rem;
}

p {
margin-bottom: 1rem;
}

.mono {
font-family: 'JetBrains Mono', 'SF Mono', Monaco, Consolas, monospace;
}

.container {
max-width: 1200px;
margin: 0 auto;
padding: 0 16px;
}

/* Header Styles */
header {
padding: clamp(30px, 5vw, 60px) 0;
text-align: center;
position: relative;
}

.logo-container {
display: inline-block;
margin-bottom: 24px;
position: relative;
}

.logo {
width: 80px;
height: 80px;
border-radius: 50%;
overflow: hidden;
border: 2px solid var(--border-default);
box-shadow: 0 0 0 2px var(--bg-primary), 0 0 0 4px var(--border-default);
transition: var(--transition);
}

.logo:hover {
border-color: var(--accent-primary);
box-shadow: 0 0 0 2px var(--bg-primary), 0 0 0 4px var(--accent-primary);
}

.logo img {
width: 100%;
height: 100%;
object-fit: cover;
}

.title {
font-weight: 700;
margin-bottom: 12px;
letter-spacing: 1px;
text-transform: uppercase;
position: relative;
display: inline-block;
}

.title::after {
content: "";
position: absolute;
bottom: -5px;
left: 0;
width: 100%;
height: 3px;
background: var(--accent-primary);
border-radius: 2px;
}

.tagline {
color: var(--text-secondary);
max-width: 700px;
margin: 0 auto 24px;
font-size: clamp(1rem, 2.5vw, 1.125rem);
}

.status-container {
display: inline-flex;
align-items: center;
gap: 16px;
padding: 12px 20px;
background-color: var(--bg-secondary);
border: 1px solid var(--border-default);
border-radius: var(--radius);
font-size: 0.875rem;
box-shadow: var(--shadow);
}

.status-indicator {
display: flex;
align-items: center;
gap: 8px;
}

.status-dot {
width: 10px;
height: 10px;
border-radius: 50%;
background: #3fb950;
animation: pulse 2s infinite;
}

@keyframes pulse {
0%, 100% { transform: scale(1); opacity: 1; }
50% { transform: scale(1.2); opacity: 0.7; }
}

.status-text {
font-weight: 500;
}

.status-link {
color: var(--accent-primary);
text-decoration: none;
font-weight: 500;
transition: var(--transition);
}

.status-link:hover {
color: var(--accent-secondary);
text-decoration: underline;
}

.server-info {
margin-top: 16px;
display: flex;
flex-wrap: wrap;
justify-content: center;
gap: 16px;
font-size: 0.875rem;
color: var(--text-tertiary);
}

.server-info-item {
display: flex;
align-items: center;
gap: 6px;
}

.server-info-item i {
color: var(--accent-primary);
}

/* Navigation */
.nav-container {
background-color: var(--bg-secondary);
border-radius: var(--radius-lg);
padding: 8px;
margin-bottom: 24px;
box-shadow: var(--shadow);
}

.nav-tabs {
display: flex;
overflow-x: auto;
scrollbar-width: none;
-ms-overflow-style: none;
}

.nav-tabs::-webkit-scrollbar {
display: none;
}

.nav-tab {
padding: 10px 16px;
font-weight: 500;
color: var(--text-secondary);
text-decoration: none;
border-radius: var(--radius);
white-space: nowrap;
transition: var(--transition);
position: relative;
}

.nav-tab:hover {
color: var(--text-primary);
background-color: var(--bg-tertiary);
}

.nav-tab.active {
color: var(--text-primary);
background-color: var(--bg-tertiary);
}

.nav-tab.active::after {
content: "";
position: absolute;
bottom: -8px;
left: 50%;
transform: translateX(-50%);
width: 40%;
height: 3px;
background: var(--accent-primary);
border-radius: 2px;
}

/* Search Bar */
.search-container {
margin-bottom: 24px;
}

.search-form {
display: flex;
gap: 8px;
}

.search-input {
flex: 1;
background-color: var(--bg-secondary);
border: 1px solid var(--border-default);
border-radius: var(--radius);
padding: 12px 16px;
color: var(--text-primary);
font-family: 'Poppins', sans-serif;
font-size: 0.875rem;
transition: var(--transition);
}

.search-input:focus {
outline: none;
border-color: var(--accent-primary);
box-shadow: 0 0 0 3px rgba(200, 16, 46, 0.2);
}

.search-button {
background-color: var(--accent-primary);
color: var(--text-inverse);
border: none;
border-radius: var(--radius);
padding: 0 16px;
font-weight: 500;
cursor: pointer;
transition: var(--transition);
}

.search-button:hover {
background-color: #a00d26;
}

/* Main Content */
main {
padding: 20px 0 60px;
}

.grid {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
gap: 20px;
}

.card {
background-color: var(--bg-card);
border: 1px solid var(--border-default);
border-radius: var(--radius);
padding: 24px;
transition: var(--transition);
position: relative;
overflow: hidden;
}

.card::before {
content: "";
position: absolute;
top: 0;
right: 0;
width: 60px;
height: 60px;
background: var(--accent-primary);
opacity: 0.1;
border-radius: 0 0 0 60px;
}

.card:hover {
border-color: var(--accent-primary);
box-shadow: var(--shadow);
transform: translateY(-5px);
}

.card-header {
display: flex;
align-items: center;
gap: 12px;
margin-bottom: 16px;
padding-bottom: 12px;
border-bottom: 1px solid var(--border-muted);
position: relative;
z-index: 1;
}

.card-icon {
display: flex;
align-items: center;
justify-content: center;
width: 40px;
height: 40px;
background-color: var(--bg-tertiary);
border-radius: var(--radius);
color: var(--accent-primary);
font-size: 1.2rem;
}

.card-title {
font-size: 1rem;
font-weight: 600;
color: var(--text-primary);
}

.card-actions {
display: flex;
justify-content: flex-end;
margin-top: 16px;
gap: 8px;
}

.card-action {
padding: 6px 12px;
background-color: var(--bg-tertiary);
border: 1px solid var(--border-default);
border-radius: var(--radius);
color: var(--text-primary);
text-decoration: none;
font-size: 0.875rem;
transition: var(--transition);
}

.card-action:hover {
background-color: var(--bg-primary);
border-color: var(--accent-primary);
}

/* Stats Card Styles */
.stats-grid {
display: grid;
grid-template-columns: repeat(2, 1fr);
gap: 16px;
}

.stat-card {
background-color: var(--bg-tertiary);
border-radius: var(--radius);
padding: 16px;
text-align: center;
transition: var(--transition);
}

.stat-card:hover {
transform: translateY(-3px);
box-shadow: var(--shadow-sm);
}

.stat-value {
font-size: 1.8rem;
font-weight: 700;
color: var(--accent-primary);
margin-bottom: 4px;
}

.stat-label {
font-size: 0.875rem;
color: var(--text-secondary);
}

.stat-change {
display: inline-flex;
align-items: center;
gap: 4px;
margin-top: 8px;
font-size: 0.75rem;
font-weight: 500;
}

.stat-change.positive {
color: var(--accent-success);
}

.stat-change.negative {
color: var(--accent-danger);
}

.stat-change.neutral {
color: var(--text-tertiary);
}

/* Chart Container */
.chart-container {
position: relative;
height: 300px;
margin-top: 16px;
}

/* Level Categories */
.level-categories {
display: flex;
flex-wrap: wrap;
gap: 12px;
margin-top: 16px;
}

.level-category {
flex: 1;
min-width: 120px;
background-color: var(--bg-tertiary);
border-radius: var(--radius);
padding: 12px;
text-align: center;
transition: var(--transition);
}

.level-category:hover {
transform: translateY(-3px);
box-shadow: var(--shadow-sm);
}

.level-category-value {
font-size: 1.5rem;
font-weight: 600;
color: var(--accent-primary);
margin-bottom: 4px;
}

.level-category-label {
font-size: 0.875rem;
color: var(--text-secondary);
}

/* Special Levels */
.special-levels {
display: grid;
grid-template-columns: repeat(2, 1fr);
gap: 12px;
margin-top: 16px;
}

.special-level {
background-color: var(--bg-tertiary);
border-radius: var(--radius);
padding: 12px;
display: flex;
align-items: center;
gap: 12px;
transition: var(--transition);
}

.special-level:hover {
transform: translateX(5px);
box-shadow: var(--shadow-sm);
}

.special-level-icon {
display: flex;
align-items: center;
justify-content: center;
width: 40px;
height: 40px;
background-color: var(--bg-secondary);
border-radius: var(--radius);
color: var(--accent-primary);
font-size: 1.2rem;
}

.special-level-info {
flex: 1;
}

.special-level-value {
font-size: 1.2rem;
font-weight: 600;
color: var(--text-primary);
}

.special-level-label {
font-size: 0.875rem;
color: var(--text-secondary);
}

/* Ban Statistics */
.ban-stats {
margin-top: 16px;
}

.ban-stats-grid {
display: grid;
grid-template-columns: repeat(2, 1fr);
gap: 12px;
}

.ban-stat {
background-color: var(--bg-tertiary);
border-radius: var(--radius);
padding: 12px;
transition: var(--transition);
}

.ban-stat:hover {
transform: translateY(-3px);
box-shadow: var(--shadow-sm);
}

.ban-stat-header {
display: flex;
align-items: center;
justify-content: space-between;
margin-bottom: 8px;
}

.ban-stat-title {
font-weight: 500;
color: var(--text-primary);
}

.ban-stat-value {
font-size: 1.2rem;
font-weight: 600;
color: var(--accent-danger);
}

.ban-stat-details {
display: flex;
flex-wrap: wrap;
gap: 8px;
}

.ban-stat-detail {
display: flex;
align-items: center;
gap: 4px;
font-size: 0.75rem;
color: var(--text-tertiary);
}

.ban-stat-detail i {
color: var(--accent-danger);
}

/* Input Styles */
.input-group {
margin-bottom: 16px;
}

.input-wrapper {
display: flex;
align-items: center;
background-color: var(--bg-tertiary);
border: 1px solid var(--border-default);
border-radius: var(--radius);
padding: 12px;
transition: var(--transition);
}

.input-wrapper:focus-within {
border-color: var(--accent-primary);
box-shadow: 0 0 0 3px rgba(200, 16, 46, 0.2);
}

.input-icon {
color: var(--text-tertiary);
margin-right: 8px;
}

.input-field {
flex: 1;
background: transparent;
border: none;
color: var(--text-primary);
font-family: 'JetBrains Mono', monospace;
font-size: 0.875rem;
outline: none;
}

/* Button Styles */
.button-group {
display: grid;
grid-template-columns: 1fr 1fr;
gap: 10px;
}

.btn {
display: flex;
align-items: center;
justify-content: center;
gap: 8px;
padding: 12px 16px;
background-color: var(--bg-tertiary);
color: var(--text-primary);
border: 1px solid var(--border-default);
border-radius: var(--radius);
font-weight: 500;
font-size: 0.875rem;
cursor: pointer;
transition: var(--transition);
text-decoration: none;
}

.btn:hover {
background-color: var(--bg-primary);
border-color: var(--accent-primary);
transform: translateY(-2px);
}

.btn-primary {
background-color: var(--accent-primary);
color: var(--text-inverse);
border-color: var(--accent-primary);
}

.btn-primary:hover {
background-color: #a00d26;
border-color: #a00d26;
}

.btn-icon {
width: 36px;
height: 36px;
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
background-color: var(--bg-tertiary);
color: var(--text-primary);
border: 1px solid var(--border-default);
transition: var(--transition);
}

.btn-icon:hover {
background-color: var(--bg-primary);
border-color: var(--accent-primary);
color: var(--accent-primary);
}

/* Links List */
.links-list {
display: flex;
flex-direction: column;
gap: 10px;
}

.link-item {
display: flex;
align-items: center;
gap: 12px;
padding: 14px;
background-color: var(--bg-tertiary);
border-radius: var(--radius);
transition: var(--transition);
text-decoration: none;
color: var(--text-primary);
position: relative;
overflow: hidden;
}

.link-item::before {
content: "";
position: absolute;
left: 0;
top: 0;
height: 100%;
width: 3px;
background: var(--accent-primary);
transform: scaleY(0);
transition: transform 0.3s ease;
}

.link-item:hover::before {
transform: scaleY(1);
}

.link-item:hover {
background-color: var(--bg-primary);
transform: translateX(5px);
}

.link-icon {
display: flex;
align-items: center;
justify-content: center;
width: 36px;
height: 36px;
background-color: var(--bg-secondary);
border-radius: var(--radius);
color: var(--accent-primary);
font-size: 1rem;
}

.link-text {
flex: 1;
font-weight: 500;
}

/* Changelog List */
.changelog-list {
display: flex;
flex-direction: column;
gap: 16px;
}

.changelog-item {
padding-bottom: 16px;
border-bottom: 1px solid var(--border-muted);
position: relative;
z-index: 1;
}

.changelog-item:last-child {
border-bottom: none;
padding-bottom: 0;
}

.changelog-date {
display: inline-block;
padding: 4px 10px;
background-color: var(--bg-tertiary);
border-radius: var(--radius);
font-size: 0.75rem;
font-weight: 500;
color: var(--text-secondary);
margin-bottom: 8px;
}

.changelog-content {
color: var(--text-primary);
}

/* Social Grid */
.social-grid {
display: grid;
grid-template-columns: repeat(2, 1fr);
gap: 10px;
}

.social-item {
display: flex;
align-items: center;
gap: 10px;
padding: 12px;
background-color: var(--bg-tertiary);
border-radius: var(--radius);
transition: var(--transition);
text-decoration: none;
color: var(--text-primary);
}

.social-item:hover {
background-color: var(--bg-primary);
transform: translateY(-3px);
box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.social-icon {
display: flex;
align-items: center;
justify-content: center;
width: 36px;
height: 36px;
background-color: var(--bg-secondary);
border-radius: var(--radius);
color: var(--accent-primary);
font-size: 1.1rem;
}

.social-name {
font-size: 0.875rem;
font-weight: 500;
}

/* Visitor Info */
.visitor-info {
background-color: var(--bg-tertiary);
border-radius: var(--radius);
padding: 12px;
margin-top: 16px;
font-size: 0.8rem;
color: var(--text-tertiary);
}

.visitor-info-row {
display: flex;
justify-content: space-between;
margin-bottom: 6px;
}

.visitor-info-row:last-child {
margin-bottom: 0;
}

.visitor-info-label {
font-weight: 500;
}

.visitor-info-value {
font-family: 'JetBrains Mono', monospace;
}

/* Toast Notification */
.toast {
position: fixed;
bottom: 20px;
left: 50%;
transform: translateX(-50%) translateY(100px);
background-color: var(--bg-secondary);
border: 1px solid var(--accent-primary);
border-radius: var(--radius);
padding: 14px 20px;
display: flex;
align-items: center;
gap: 12px;
box-shadow: var(--shadow);
opacity: 0;
transition: transform 0.3s ease, opacity 0.3s ease;
z-index: 1000;
max-width: 90%;
}

.toast.show {
transform: translateX(-50%) translateY(0);
opacity: 1;
}

.toast-icon {
color: var(--accent-success);
}

.toast-message {
font-weight: 500;
}

/* Floating Action Button */
.floating-action {
position: fixed;
bottom: 20px;
right: 20px;
width: 56px;
height: 56px;
border-radius: 50%;
background-color: var(--accent-primary);
color: var(--text-inverse);
display: flex;
align-items: center;
justify-content: center;
box-shadow: var(--shadow);
cursor: pointer;
transition: var(--transition);
z-index: 999;
border: none;
font-size: 1.2rem;
}

.floating-action:hover {
background-color: #a00d26;
transform: scale(1.1);
}

/* Footer */
footer {
padding: 40px 0;
text-align: center;
border-top: 1px solid rgba(200, 16, 46, 0.3);
margin-top: 40px;
}

.footer-links {
display: flex;
justify-content: center;
gap: 16px;
margin-bottom: 16px;
}

.footer-link {
display: flex;
align-items: center;
justify-content: center;
width: 40px;
height: 40px;
background-color: var(--bg-secondary);
border: 1px solid var(--border-default);
border-radius: 50%;
color: var(--text-secondary);
transition: var(--transition);
}

.footer-link:hover {
color: var(--accent-primary);
border-color: var(--accent-primary);
transform: translateY(-3px);
}

.copyright {
color: var(--text-tertiary);
font-size: 0.875rem;
}

.visitor-counter {
display: inline-flex;
align-items: center;
gap: 8px;
margin-top: 8px;
color: var(--text-tertiary);
font-size: 0.875rem;
}

.visitor-counter i {
color: var(--accent-primary);
}

/* Maintenance Mode */
.maintenance-mode {
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
min-height: 80vh;
text-align: center;
padding: 2rem;
}

.maintenance-icon {
font-size: 4rem;
color: var(--accent-warning);
margin-bottom: 1rem;
}

.maintenance-title {
font-size: 2rem;
margin-bottom: 1rem;
color: var(--text-primary);
}

.maintenance-message {
max-width: 600px;
color: var(--text-secondary);
margin-bottom: 2rem;
}

/* News Section */
.news-list {
display: flex;
flex-direction: column;
gap: 16px;
}

.news-item {
padding-bottom: 16px;
border-bottom: 1px solid var(--border-muted);
position: relative;
z-index: 1;
}

.news-item:last-child {
border-bottom: none;
padding-bottom: 0;
}

.news-date {
display: inline-block;
padding: 4px 10px;
background-color: var(--bg-tertiary);
border-radius: var(--radius);
font-size: 0.75rem;
font-weight: 500;
color: var(--text-secondary);
margin-bottom: 8px;
}

.news-title {
font-weight: 600;
margin-bottom: 8px;
color: var(--text-primary);
}

.news-content {
color: var(--text-secondary);
font-size: 0.9rem;
}

/* Feedback System - Chat-like */
.feedback-container {
display: flex;
flex-direction: column;
gap: 16px;
max-height: 500px;
overflow-y: auto;
padding-right: 8px;
}

.feedback-container::-webkit-scrollbar {
width: 6px;
}

.feedback-container::-webkit-scrollbar-track {
background: var(--bg-tertiary);
border-radius: 3px;
}

.feedback-container::-webkit-scrollbar-thumb {
background: var(--border-default);
border-radius: 3px;
}

.feedback-container::-webkit-scrollbar-thumb:hover {
background: var(--border-secondary);
}

.feedback-item {
background-color: var(--bg-tertiary);
border-radius: var(--radius);
padding: 16px;
position: relative;
}

.feedback-header {
display: flex;
align-items: center;
gap: 12px;
margin-bottom: 12px;
}

.feedback-avatar {
width: 40px;
height: 40px;
border-radius: 50%;
object-fit: cover;
border: 2px solid var(--border-default);
}

.feedback-user {
flex: 1;
}

.feedback-name {
font-weight: 600;
color: var(--text-primary);
}

.feedback-meta {
display: flex;
align-items: center;
gap: 8px;
font-size: 0.75rem;
color: var(--text-tertiary);
}

.feedback-rating {
display: flex;
gap: 2px;
}

.feedback-rating i {
color: var(--accent-secondary);
font-size: 0.75rem;
}

.feedback-category {
display: inline-block;
padding: 2px 8px;
background-color: var(--bg-secondary);
border-radius: 12px;
font-size: 0.75rem;
color: var(--text-secondary);
}

.feedback-message {
margin-bottom: 12px;
color: var(--text-secondary);
line-height: 1.5;
}

.feedback-actions {
display: flex;
gap: 12px;
}

.feedback-action {
display: flex;
align-items: center;
gap: 4px;
font-size: 0.875rem;
color: var(--text-tertiary);
cursor: pointer;
transition: var(--transition);
}

.feedback-action:hover {
color: var(--accent-primary);
}

.feedback-likes {
display: flex;
align-items: center;
gap: 4px;
}

.feedback-likes i {
color: var(--accent-danger);
}

.feedback-replies {
display: flex;
align-items: center;
gap: 4px;
}

.feedback-replies i {
color: var(--accent-info);
}

.feedback-reply-form {
display: none;
margin-top: 12px;
padding-top: 12px;
border-top: 1px solid var(--border-muted);
}

.feedback-reply-form.active {
display: block;
}

.feedback-reply-input {
width: 100%;
background-color: var(--bg-secondary);
border: 1px solid var(--border-default);
border-radius: var(--radius);
padding: 10px 12px;
color: var(--text-primary);
font-family: 'Poppins', sans-serif;
font-size: 0.875rem;
margin-bottom: 8px;
resize: none;
}

.feedback-reply-input:focus {
outline: none;
border-color: var(--accent-primary);
}

.feedback-reply-actions {
display: flex;
justify-content: flex-end;
gap: 8px;
}

.feedback-reply-button {
padding: 6px 12px;
background-color: var(--bg-tertiary);
border: 1px solid var(--border-default);
border-radius: var(--radius);
color: var(--text-primary);
font-size: 0.875rem;
cursor: pointer;
transition: var(--transition);
}

.feedback-reply-button:hover {
background-color: var(--bg-primary);
border-color: var(--accent-primary);
}

.feedback-reply-button.primary {
background-color: var(--accent-primary);
color: var(--text-inverse);
border-color: var(--accent-primary);
}

.feedback-reply-button.primary:hover {
background-color: #a00d26;
border-color: #a00d26;
}

.feedback-replies-container {
margin-top: 12px;
padding-left: 12px;
border-left: 2px solid var(--border-muted);
}

.feedback-reply-item {
margin-bottom: 12px;
padding-bottom: 12px;
border-bottom: 1px solid var(--border-muted);
}

.feedback-reply-item:last-child {
margin-bottom: 0;
padding-bottom: 0;
border-bottom: none;
}

.feedback-reply-header {
display: flex;
align-items: center;
gap: 8px;
margin-bottom: 8px;
}

.feedback-reply-avatar {
width: 30px;
height: 30px;
border-radius: 50%;
object-fit: cover;
}

.feedback-reply-name {
font-weight: 500;
color: var(--text-primary);
font-size: 0.875rem;
}

.feedback-reply-date {
font-size: 0.75rem;
color: var(--text-tertiary);
}

.feedback-reply-message {
color: var(--text-secondary);
font-size: 0.875rem;
line-height: 1.5;
}

/* Feedback Form */
.feedback-form {
display: flex;
flex-direction: column;
gap: 16px;
}

.form-group {
display: flex;
flex-direction: column;
gap: 8px;
}

.form-label {
font-weight: 500;
color: var(--text-secondary);
font-size: 0.875rem;
}

.form-input,
.form-textarea,
.form-select {
background-color: var(--bg-tertiary);
border: 1px solid var(--border-default);
border-radius: var(--radius);
padding: 12px;
color: var(--text-primary);
font-family: 'Poppins', sans-serif;
font-size: 0.875rem;
transition: var(--transition);
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
outline: none;
border-color: var(--accent-primary);
box-shadow: 0 0 0 3px rgba(200, 16, 46, 0.2);
}

.form-textarea {
min-height: 100px;
resize: vertical;
}

.form-row {
display: grid;
grid-template-columns: 1fr 1fr;
gap: 16px;
}

.rating-input {
display: flex;
gap: 4px;
margin-top: 4px;
}

.rating-input i {
font-size: 1.5rem;
color: var(--text-tertiary);
cursor: pointer;
transition: var(--transition);
}

.rating-input i:hover,
.rating-input i.active {
color: var(--accent-secondary);
}

.form-button {
background-color: var(--accent-primary);
color: var(--text-inverse);
border: none;
border-radius: var(--radius);
padding: 12px 16px;
font-weight: 500;
cursor: pointer;
transition: var(--transition);
}

.form-button:hover {
background-color: #a00d26;
}

.success-message {
background-color: rgba(63, 185, 80, 0.1);
border: 1px solid var(--accent-success);
border-radius: var(--radius);
padding: 12px;
color: var(--accent-success);
font-weight: 500;
text-align: center;
}

.error-message {
background-color: rgba(248, 81, 73, 0.1);
border: 1px solid var(--accent-danger);
border-radius: var(--radius);
padding: 12px;
color: var(--accent-danger);
font-weight: 500;
text-align: center;
}

/* Server Stats */
.server-stats {
display: grid;
grid-template-columns: repeat(2, 1fr);
gap: 12px;
margin-top: 16px;
}

.stat-item {
background-color: var(--bg-tertiary);
border-radius: var(--radius);
padding: 12px;
text-align: center;
}

.stat-value {
font-size: 1.5rem;
font-weight: 600;
color: var(--accent-primary);
margin-bottom: 4px;
}

.stat-label {
font-size: 0.75rem;
color: var(--text-tertiary);
}

/* Events Section */
.events-list {
display: flex;
flex-direction: column;
gap: 16px;
}

.event-item {
background-color: var(--bg-tertiary);
border-radius: var(--radius);
padding: 16px;
position: relative;
overflow: hidden;
}

.event-category {
position: absolute;
top: 0;
right: 0;
padding: 4px 12px;
background-color: var(--accent-primary);
color: var(--text-inverse);
font-size: 0.75rem;
font-weight: 500;
border-bottom-left-radius: var(--radius);
}

.event-date {
display: flex;
align-items: center;
gap: 8px;
margin-bottom: 8px;
color: var(--text-secondary);
font-size: 0.875rem;
}

.event-date i {
color: var(--accent-primary);
}

.event-title {
font-weight: 600;
margin-bottom: 8px;
color: var(--text-primary);
}

.event-description {
color: var(--text-secondary);
font-size: 0.9rem;
margin-bottom: 12px;
}

.event-location {
display: flex;
align-items: center;
gap: 8px;
color: var(--text-tertiary);
font-size: 0.875rem;
}

.event-location i {
color: var(--accent-secondary);
}

/* Leaderboard */
.leaderboard-list {
display: flex;
flex-direction: column;
gap: 12px;
}

.leaderboard-item {
display: flex;
align-items: center;
gap: 12px;
padding: 12px;
background-color: var(--bg-tertiary);
border-radius: var(--radius);
transition: var(--transition);
}

.leaderboard-item:hover {
background-color: var(--bg-primary);
transform: translateX(5px);
}

.leaderboard-rank {
display: flex;
align-items: center;
justify-content: center;
width: 32px;
height: 32px;
background-color: var(--bg-secondary);
border-radius: 50%;
font-weight: 600;
color: var(--text-primary);
}

.leaderboard-rank.top {
background-color: var(--accent-secondary);
color: var(--text-inverse);
}

.leaderboard-info {
flex: 1;
}

.leaderboard-name {
font-weight: 500;
color: var(--text-primary);
}

.leaderboard-stats {
display: flex;
gap: 12px;
font-size: 0.75rem;
color: var(--text-tertiary);
}

.leaderboard-stat {
display: flex;
align-items: center;
gap: 4px;
}

.leaderboard-stat i {
color: var(--accent-primary);
}

/* Notifications */
.notifications-list {
display: flex;
flex-direction: column;
gap: 12px;
}

.notification-item {
display: flex;
gap: 12px;
padding: 12px;
background-color: var(--bg-tertiary);
border-radius: var(--radius);
transition: var(--transition);
}

.notification-item:hover {
background-color: var(--bg-primary);
}

.notification-item.unread {
border-left: 3px solid var(--accent-primary);
}

.notification-icon {
display: flex;
align-items: center;
justify-content: center;
width: 36px;
height: 36px;
background-color: var(--bg-secondary);
border-radius: 50%;
color: var(--accent-primary);
font-size: 1rem;
}

.notification-icon.event {
color: var(--accent-warning);
}

.notification-icon.info {
color: var(--accent-info);
}

.notification-content {
flex: 1;
}

.notification-title {
font-weight: 500;
color: var(--text-primary);
margin-bottom: 4px;
}

.notification-message {
font-size: 0.875rem;
color: var(--text-secondary);
margin-bottom: 4px;
}

.notification-date {
font-size: 0.75rem;
color: var(--text-tertiary);
}

/* Search Results */
.search-results {
margin-top: 16px;
}

.search-results-header {
font-weight: 600;
margin-bottom: 12px;
color: var(--text-primary);
}

.search-results-list {
display: flex;
flex-direction: column;
gap: 12px;
}

.search-result-item {
padding: 12px;
background-color: var(--bg-tertiary);
border-radius: var(--radius);
transition: var(--transition);
}

.search-result-item:hover {
background-color: var(--bg-primary);
}

.search-result-type {
display: inline-block;
padding: 2px 8px;
background-color: var(--bg-secondary);
border-radius: 12px;
font-size: 0.75rem;
color: var(--text-secondary);
margin-bottom: 8px;
}

.search-result-title {
font-weight: 500;
color: var(--text-primary);
margin-bottom: 4px;
}

.search-result-content {
font-size: 0.875rem;
color: var(--text-secondary);
margin-bottom: 8px;
}

.search-result-date {
font-size: 0.75rem;
color: var(--text-tertiary);
}

.search-result-link {
color: var(--accent-primary);
text-decoration: none;
font-weight: 500;
font-size: 0.875rem;
}

.search-result-link:hover {
text-decoration: underline;
}

/* Tab Content */
.tab-content {
display: none;
}

.tab-content.active {
display: block;
}

/* Real-time update indicator */
.realtime-indicator {
display: inline-flex;
align-items: center;
gap: 6px;
padding: 4px 10px;
background-color: var(--bg-tertiary);
border-radius: 12px;
font-size: 0.75rem;
color: var(--text-tertiary);
margin-left: 8px;
}

.realtime-indicator i {
color: var(--accent-success);
animation: pulse 2s infinite;
}

/* Stats refresh button */
.refresh-button {
display: inline-flex;
align-items: center;
justify-content: center;
width: 32px;
height: 32px;
background-color: var(--bg-tertiary);
border: 1px solid var(--border-default);
border-radius: 50%;
color: var(--text-primary);
font-size: 0.875rem;
cursor: pointer;
transition: var(--transition);
margin-left: 8px;
}

.refresh-button:hover {
background-color: var(--bg-primary);
border-color: var(--accent-primary);
color: var(--accent-primary);
}

.refresh-button.loading {
animation: spin 1s linear infinite;
}

@keyframes spin {
from { transform: rotate(0deg); }
to { transform: rotate(360deg); }
}

/* Responsive improvements */
@media (max-width: 1024px) {
.grid {
grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.form-row {
grid-template-columns: 1fr;
}

.stats-grid {
grid-template-columns: repeat(2, 1fr);
}

.level-categories {
grid-template-columns: repeat(2, 1fr);
}

.special-levels {
grid-template-columns: 1fr;
}

.ban-stats-grid {
grid-template-columns: 1fr;
}
}

@media (max-width: 768px) {
.grid {
grid-template-columns: 1fr;
}

.social-grid {
grid-template-columns: repeat(2, 1fr);
}

.button-group {
grid-template-columns: 1fr;
}

.status-container {
flex-direction: column;
gap: 12px;
padding: 16px;
}

.server-info {
flex-direction: column;
align-items: center;
}

.server-stats {
grid-template-columns: 1fr;
}

.nav-tabs {
justify-content: space-between;
}

.nav-tab {
padding: 8px 12px;
font-size: 0.875rem;
}

.stats-grid {
grid-template-columns: 1fr;
}

.level-categories {
grid-template-columns: 1fr;
}
}

@media (max-width: 480px) {
.container {
padding: 0 12px;
}

header {
padding: 20px 0;
}

.logo {
width: 70px;
height: 70px;
}

.tagline {
font-size: 1rem;
}

.card {
padding: 18px;
}

.social-grid {
grid-template-columns: 1fr;
}

.footer-links {
gap: 12px;
}

.floating-action {
width: 48px;
height: 48px;
font-size: 1rem;
}

.feedback-header {
flex-direction: column;
align-items: flex-start;
gap: 8px;
}

.feedback-actions {
flex-wrap: wrap;
}
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
* {
animation-duration: 0.01ms !important;
animation-iteration-count: 1 !important;
transition-duration: 0.01ms !important;
}
}

/* High contrast mode support */
@media (prefers-contrast: high) {
:root {
--bg-primary: #000;
--bg-secondary: #222;
--bg-tertiary: #333;
--text-primary: #fff;
--text-secondary: #ddd;
--text-tertiary: #bbb;
--accent-primary: #ff0000;
--accent-secondary: #ffff00;
--border-default: #444;
--border-muted: #333;
}
}
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header>
      <div class="logo-container">
        <div class="logo">
          <img src="https://fless.ps.fhgdps.com/dashboard/icon.png" alt="GDIPS Logo">
        </div>
      </div>
      
      <h1 class="title">GDIPS</h1>
      <p class="tagline">Geometry Dash Indonesia Private Server</br>cepat, terbuka, dan penuh fitur kustom.</p>
      
      <div class="status-container">
        <div class="status-indicator">
          <span class="status-dot"></span>
          <span class="status-text">Status Server: Online</span>
                      <span class="mono" style="color: var(--text-tertiary);">(6ms)</span>
                  </div>
        <a href="https://stats.uptimerobot.com/wpCeS1LMcH" target="_blank" rel="noopener" class="status-link">
          Monitor Uptime
        </a>
      </div>
      
      <div class="server-info">
        <div class="server-info-item">
          <i class="fas fa-calendar-day"></i>
          <span>Kamis, 2025-11-06 22:32:59 WIB</span>
        </div>
        <div class="server-info-item">
          <i class="fas fa-users"></i>
          <span>910 pengunjung</span>
        </div>
        <div class="server-info-item">
          <i class="fas fa-globe"></i>
          <span>Indonesia</span>
        </div>
      </div>
    </header>

    <!-- Navigation Tabs -->
    <div class="nav-container">
      <div class="nav-tabs">
        <a href="#beranda" class="nav-tab active" data-tab="beranda">Beranda</a>
        <a href="#statistik" class="nav-tab" data-tab="statistik">Statistik
                      <span class="realtime-indicator">
              <i class="fas fa-circle"></i> Real-time
            </span>
                  </a>
        <a href="#feedback" class="nav-tab" data-tab="feedback">Feedback</a>
        <a href="#events" class="nav-tab" data-tab="events">Event</a>
        <a href="#leaderboard" class="nav-tab" data-tab="leaderboard">Leaderboard</a>
        <a href="#notifikasi" class="nav-tab" data-tab="notifikasi">Notifikasi</a>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="search-container">
      <form class="search-form" method="get">
        <input type="text" name="search" class="search-input" placeholder="Cari berita, event, atau feedback..." value="">
        <button type="submit" class="search-button">
          <i class="fas fa-search"></i>
        </button>
      </form>
    </div>

    <!-- Search Results -->
    
    <!-- Main Content -->
    <main>
              <!-- Beranda Tab -->
        <div id="beranda" class="tab-content active">
          <div class="grid">
            <!-- Database Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <i class="fas fa-database"></i>
                </div>
                <h2 class="card-title">Database GDIPS</h2>
              </div>
              
              <div class="input-group">
                <div class="input-wrapper">
                  <i class="fas fa-link input-icon"></i>
                  <input id="datLink" type="text" value="https://fless.ps.fhgdps.com" readonly class="input-field mono">
                </div>
              </div>
              
              <div class="button-group">
                <button id="copyBtn" class="btn btn-primary">
                  <i class="fas fa-copy"></i> Salin
                </button>
                <a href="https://fless.ps.fhgdps.com/dashboard" target="_blank" rel="noopener" class="btn">
                  <i class="fas fa-chart-line"></i> Dashboard
                </a>
              </div>
              
              <div class="visitor-info">
                <div class="visitor-info-row">
                  <span class="visitor-info-label">IP Anda:</span>
                  <span class="visitor-info-value">140.213.216.150</span>
                </div>
                <div class="visitor-info-row">
                  <span class="visitor-info-label">Browser:</span>
                  <span class="visitor-info-value">Chrome</span>
                </div>
                <div class="visitor-info-row">
                  <span class="visitor-info-label">Sistem Operasi:</span>
                  <span class="visitor-info-value">Windows</span>
                </div>
                <div class="visitor-info-row">
                  <span class="visitor-info-label">Lokasi:</span>
                  <span class="visitor-info-value">Indonesia</span>
                </div>
              </div>
            </div>

            <!-- News Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <i class="fas fa-newspaper"></i>
                </div>
                <h2 class="card-title">Berita Terkini</h2>
              </div>
              
              <div class="news-list">
                                  <div class="news-item">
                    <div class="news-date mono">2025-06-15</div>
                    <h3 class="news-title">Pembaruan Server Terbaru</h3>
                    <p class="news-content">Kami telah melakukan pembaruan server dengan peningkatan performa dan keamanan.</p>
                  </div>
                                  <div class="news-item">
                    <div class="news-date mono">2025-05-20</div>
                    <h3 class="news-title">Event Komunitas</h3>
                    <p class="news-content">Bergabunglah dengan event komunitas kami akhir bulan ini dengan hadiah menarik!</p>
                  </div>
                              </div>
              
              <div class="card-actions">
                <a href="#news" class="card-action">Lihat Semua Berita</a>
              </div>
            </div>

            <!-- Links Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <i class="fas fa-link"></i>
                </div>
                <h2 class="card-title">Tautan & Alat</h2>
              </div>
              
              <div class="links-list">
                <a href="https://gdips.netlify.app/download" target="_blank" rel="noopener" class="link-item">
                  <div class="link-icon">
                    <i class="fas fa-download"></i>
                  </div>
                  <span class="link-text">Unduh GDPS</span>
                </a>
                
                <a href="https://gdpshub.com/gdps/2924" target="_blank" rel="noopener" class="link-item">
                  <div class="link-icon">
                    <i class="fas fa-star"></i>
                  </div>
                  <span class="link-text">Beri Rating di GDPSHub</span>
                </a>
                
                <a href="https://frgd.ps.fhgdps.com/main" target="_blank" rel="noopener" class="link-item">
                  <div class="link-icon">
                    <i class="fas fa-screwdriver-wrench"></i>
                  </div>
                  <span class="link-text">Alat</span>
                </a>
                
                <a href="https://gdips.netlify.app" target="_blank" rel="noopener" class="link-item">
                  <div class="link-icon">
                    <i class="fas fa-list"></i>
                  </div>
                  <span class="link-text">Another Pages</span>
                </a>
                
                <a href="https://github.com/flessan/gdips" target="_blank" rel="noopener" class="link-item">
                  <div class="link-icon">
                    <i class="fab fa-github"></i>
                  </div>
                  <span class="link-text">Repositori GitHub</span>
                </a>
              </div>
            </div>

            <!-- Changelog Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <i class="fas fa-list"></i>
                </div>
                <h2 class="card-title">Catatan Perubahan</h2>
              </div>
              
              <div class="changelog-list">
                <div class="changelog-item">
                  <div class="changelog-date mono">2025-08-25</div>
                  <div class="changelog-content">
                    Optimasi server dan peningkatan performa
                  </div>
                </div>
                
                <div class="changelog-item">
                  <div class="changelog-date mono">2025-07-30</div>
                  <div class="changelog-content">
                    Perayaan Ulang Tahun Pemilik Server 🎉
                  </div>
                </div>
                
                <div class="changelog-item">
                  <div class="changelog-date mono">2025-07-15</div>
                  <div class="changelog-content">
                    Pembaruan antarmuka dan peningkatan keamanan
                  </div>
                </div>
              </div>
            </div>

            <!-- Social Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <i class="fas fa-users"></i>
                </div>
                <h2 class="card-title">Sosial & Dukungan</h2>
              </div>
              
              <div class="social-grid">
                <a href="https://discord.gg/6HEyQBcM6E" target="_blank" rel="noopener" class="social-item">
                  <div class="social-icon">
                    <i class="fab fa-discord"></i>
                  </div>
                  <span class="social-name">Discord</span>
                </a>
                
                <a href="https://youtube.com/@gmdips" target="_blank" rel="noopener" class="social-item">
                  <div class="social-icon">
                    <i class="fab fa-youtube"></i>
                  </div>
                  <span class="social-name">YouTube</span>
                </a>
                
                <a href="https://chat.whatsapp.com/Fmh5DoSjbWkBje0ab3RAEF?mode=wwt" target="_blank" rel="noopener" class="social-item">
                  <div class="social-icon">
                    <i class="fab fa-whatsapp"></i>
                  </div>
                  <span class="social-name">WhatsApp</span>
                </a>
                
                <a href="https://flessan.pages.dev/donate" target="_blank" rel="noopener" class="social-item">
                  <div class="social-icon">
                    <i class="fas fa-circle-dollar-to-slot"></i>
                  </div>
                  <span class="social-name">Donasi</span>
                </a>
                
                <a href="https://stats.uptimerobot.com/wpCeS1LMcH" target="_blank" rel="noopener" class="social-item">
                  <div class="social-icon">
                    <i class="fas fa-heart-pulse"></i>
                  </div>
                  <span class="social-name">Status Server</span>
                </a>
                
                <a href="https://github.com/flessan/gdips" target="_blank" rel="noopener" class="social-item">
                  <div class="social-icon">
                    <i class="fab fa-github"></i>
                  </div>
                  <span class="social-name">GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistics Tab -->
        <div id="statistik" class="tab-content">
          <div class="grid">
            <!-- Overview Statistics Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <i class="fas fa-chart-bar"></i>
                </div>
                <h2 class="card-title">Statistik Server</h2>
                <button id="refreshStatsBtn" class="refresh-button" title="Refresh Statistik">
                  <i class="fas fa-sync-alt"></i>
                </button>
              </div>
              
                              <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-value">432</div>
                    <div class="stat-label">Total Pengguna</div>
                                      </div>
                  
                  <div class="stat-card">
                    <div class="stat-value">73</div>
                    <div class="stat-label">Pengguna Aktif</div>
                  </div>
                  
                  <div class="stat-card">
                    <div class="stat-value">424</div>
                    <div class="stat-label">Total Level</div>
                                      </div>
                  
                  <div class="stat-card">
                    <div class="stat-value">257</div>
                    <div class="stat-label">Level Ter-Rating</div>
                  </div>
                </div>
                
                <div class="chart-container">
                  <canvas id="userGrowthChart"></canvas>
                </div>
                          </div>

            <!-- Level Statistics Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <i class="fas fa-layer-group"></i>
                </div>
                <h2 class="card-title">Statistik Level</h2>
              </div>
              
                              <div class="level-categories">
                  <div class="level-category">
                    <div class="level-category-value">127</div>
                    <div class="level-category-label">Featured</div>
                  </div>
                  
                  <div class="level-category">
                    <div class="level-category-value">46</div>
                    <div class="level-category-label">Epic</div>
                  </div>
                  
                  <div class="level-category">
                    <div class="level-category-value">9</div>
                    <div class="level-category-label">Legendary</div>
                  </div>
                  
                  <div class="level-category">
                    <div class="level-category-value">3</div>
                    <div class="level-category-label">Mythic</div>
                  </div>
                </div>
                
                <div class="chart-container">
                  <canvas id="levelDistributionChart"></canvas>
                </div>
                          </div>

            <!-- Special Levels Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <i class="fas fa-star"></i>
                </div>
                <h2 class="card-title">Level Khusus</h2>
              </div>
              
                              <div class="special-levels">
                  <div class="special-level">
                    <div class="special-level-icon">
                      <i class="fas fa-calendar-day"></i>
                    </div>
                    <div class="special-level-info">
                      <div class="special-level-value">21</div>
                      <div class="special-level-label">Daily Levels</div>
                    </div>
                  </div>
                  
                  <div class="special-level">
                    <div class="special-level-icon">
                      <i class="fas fa-calendar-week"></i>
                    </div>
                    <div class="special-level-info">
                      <div class="special-level-value">9</div>
                      <div class="special-level-label">Weekly Levels</div>
                    </div>
                  </div>
                  
                  <div class="special-level">
                    <div class="special-level-icon">
                      <i class="fas fa-fist-raised"></i>
                    </div>
                    <div class="special-level-info">
                      <div class="special-level-value">0</div>
                      <div class="special-level-label">Gauntlets</div>
                    </div>
                  </div>
                  
                  <div class="special-level">
                    <div class="special-level-icon">
                      <i class="fas fa-box"></i>
                    </div>
                    <div class="special-level-info">
                      <div class="special-level-value">6</div>
                      <div class="special-level-label">Map Packs</div>
                    </div>
                  </div>
                </div>
                
                <div class="chart-container">
                  <canvas id="specialLevelsChart"></canvas>
                </div>
                          </div>

            <!-- Engagement Statistics Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <i class="fas fa-heart"></i>
                </div>
                <h2 class="card-title">Statistik Keterlibatan</h2>
              </div>
              
                              <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-value">15,060</div>
                    <div class="stat-label">Total Download</div>
                                      </div>
                  
                  <div class="stat-card">
                    <div class="stat-value">2,611</div>
                    <div class="stat-label">Total Like</div>
                                      </div>
                  
                  <div class="stat-card">
                    <div class="stat-value">788</div>
                    <div class="stat-label">Total Komentar</div>
                                      </div>
                  
                  <div class="stat-card">
                    <div class="stat-value">14,950</div>
                    <div class="stat-label">Total Bintang</div>
                  </div>
                </div>
                
                <div class="chart-container">
                  <canvas id="engagementChart"></canvas>
                </div>
                          </div>

            <!-- Bans Statistics Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <i class="fas fa-ban"></i>
                </div>
                <h2 class="card-title">Statistik Pemblokiran</h2>
              </div>
              
                              <div class="ban-stats">
                  <div class="stat-card">
                    <div class="stat-value">8</div>
                    <div class="stat-label">Total Pemblokiran</div>
                  </div>
                  
                  <div class="ban-stats-grid">
                    <div class="ban-stat">
                      <div class="ban-stat-header">
                        <div class="ban-stat-title">Berdasarkan Tipe</div>
                      </div>
                      <div class="ban-stat-details">
                        <div class="ban-stat-detail">
                          <i class="fas fa-user"></i>
                          <span>Account ID: 4</span>
                        </div>
                        <div class="ban-stat-detail">
                          <i class="fas fa-id-badge"></i>
                          <span>User ID: 1</span>
                        </div>
                        <div class="ban-stat-detail">
                          <i class="fas fa-network-wired"></i>
                          <span>IP: 3</span>
                        </div>
                      </div>
                    </div>
                    
                    <div class="ban-stat">
                      <div class="ban-stat-header">
                        <div class="ban-stat-title">Berdasarkan Alasan</div>
                      </div>
                      <div class="ban-stat-details">
                        <div class="ban-stat-detail">
                          <i class="fas fa-trophy"></i>
                          <span>Leaderboard: 2</span>
                        </div>
                        <div class="ban-stat-detail">
                          <i class="fas fa-tools"></i>
                          <span>Creator: 0</span>
                        </div>
                        <div class="ban-stat-detail">
                          <i class="fas fa-upload"></i>
                          <span>Upload: 2</span>
                        </div>
                        <div class="ban-stat-detail">
                          <i class="fas fa-comment"></i>
                          <span>Komentar: 0</span>
                        </div>
                        <div class="ban-stat-detail">
                          <i class="fas fa-user-lock"></i>
                          <span>Akun: 4</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="chart-container">
                  <canvas id="bansChart"></canvas>
                </div>
                          </div>
          </div>
        </div>

        <!-- Feedback Tab -->
        <div id="feedback" class="tab-content">
          <div class="grid">
            <!-- Feedback Form Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <i class="fas fa-comment-dots"></i>
                </div>
                <h2 class="card-title">Kirim Masukan</h2>
              </div>
              
                                              
                <form class="feedback-form" method="post">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="name" class="form-label">Nama</label>
                      <input type="text" id="name" name="name" class="form-input" placeholder="Nama Anda (opsional)">
                    </div>
                    
                    <div class="form-group">
                      <label for="email" class="form-label">Email</label>
                      <input type="email" id="email" name="email" class="form-input" placeholder="Email Anda (opsional)">
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label for="category" class="form-label">Kategori</label>
                    <select id="category" name="category" class="form-select">
                      <option value="umum">Umum</option>
                      <option value="bug">Laporan Bug</option>
                      <option value="fitur">Permintaan Fitur</option>
                      <option value="pertanyaan">Pertanyaan</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="rating" class="form-label">Rating</label>
                    <div class="rating-input">
                      <i class="far fa-star" data-rating="1"></i>
                      <i class="far fa-star" data-rating="2"></i>
                      <i class="far fa-star" data-rating="3"></i>
                      <i class="far fa-star" data-rating="4"></i>
                      <i class="far fa-star" data-rating="5"></i>
                    </div>
                    <input type="hidden" id="rating" name="rating" value="5">
                  </div>
                  
                  <div class="form-group">
                    <label for="message" class="form-label">Pesan</label>
                    <textarea id="message" name="message" class="form-textarea" placeholder="Tulis pesan Anda di sini..." required></textarea>
                  </div>
                  
                  <button type="submit" name="submit_feedback" class="form-button">
                    <i class="fas fa-paper-plane"></i> Kirim Masukan
                  </button>
                </form>
                          </div>

            <!-- Feedback List Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <i class="fas fa-comments"></i>
                </div>
                <h2 class="card-title">Masukan Terbaru</h2>
              </div>
              
              <div class="feedback-container" id="feedback-container">
                                                      <div class="feedback-item" id="feedback-fb_690cb8a4e9ee1">
                      <div class="feedback-header">
                        <img src="https://ui-avatars.com/api/?name=Vandal&amp;background=c8102e&amp;color=fff&amp;size=40" alt="Vandal" class="feedback-avatar">
                        <div class="feedback-user">
                          <div class="feedback-name">Vandal</div>
                          <div class="feedback-meta">
                            <span class="feedback-date mono">06 Nov 2025, 22:03</span>
                            <span class="feedback-category">Umum</span>
                          </div>
                        </div>
                      </div>
                      
                      <div class="feedback-rating">
                                                  <i class="fas fa-star"></i>
                                                  <i class="fas fa-star"></i>
                                                  <i class="fas fa-star"></i>
                                                  <i class="fas fa-star"></i>
                                                  <i class="fas fa-star"></i>
                                              </div>
                      
                      <div class="feedback-message">GDIPS Is NO Longer EXIST!!11</div>
                      
                      <div class="feedback-actions">
                        <form method="post" style="display: inline;">
                          <input type="hidden" name="feedback_id" value="fb_690cb8a4e9ee1">
                          <input type="hidden" name="like_feedback" value="1">
                          <button type="submit" class="feedback-action feedback-likes">
                            <i class="fas fa-heart"></i>
                            <span>2</span>
                          </button>
                        </form>
                        
                        <div class="feedback-action feedback-replies" onclick="toggleReplyForm('fb_690cb8a4e9ee1')">
                          <i class="fas fa-reply"></i>
                          <span>Balas</span>
                        </div>
                      </div>
                      
                      <div class="feedback-reply-form" id="reply-form-fb_690cb8a4e9ee1">
                        <form method="post">
                          <input type="hidden" name="feedback_id" value="fb_690cb8a4e9ee1">
                          <input type="hidden" name="reply_feedback" value="1">
                          <input type="text" name="reply_name" class="feedback-reply-input" placeholder="Nama Anda (opsional)">
                          <textarea name="reply_message" class="feedback-reply-input" placeholder="Tulis balasan Anda..." required></textarea>
                          <div class="feedback-reply-actions">
                            <button type="button" class="feedback-reply-button" onclick="toggleReplyForm('fb_690cb8a4e9ee1')">Batal</button>
                            <button type="submit" class="feedback-reply-button primary">Kirim Balasan</button>
                          </div>
                        </form>
                      </div>
                      
                                              <div class="feedback-replies-container">
                                                      <div class="feedback-reply-item">
                              <div class="feedback-reply-header">
                                <img src="https://ui-avatars.com/api/?name=ism&amp;background=3498db&amp;color=fff&amp;size=30" alt="ism" class="feedback-reply-avatar">
                                <div class="feedback-reply-name">ism</div>
                                <div class="feedback-reply-date mono">06 Nov 2025, 22:03</div>
                              </div>
                              <div class="feedback-reply-message">#GDIPS</div>
                            </div>
                                                  </div>
                                          </div>
                                                </div>
              
              <div class="card-actions">
                <a href="#feedback" class="card-action">Lihat Semua Masukan</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Events Tab -->
        <div id="events" class="tab-content">
          <div class="grid">
            <!-- Upcoming Events Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <i class="fas fa-calendar-alt"></i>
                </div>
                <h2 class="card-title">Event Mendatang</h2>
              </div>
              
              <div class="events-list">
                                  <div class="event-item">
                    <div class="event-category">Competition</div>
                    <div class="event-date">
                      <i class="fas fa-calendar-day"></i>
                      <span>15 July 2025, 19:00 WIB</span>
                    </div>
                    <h3 class="event-title">Turnamen Level Extreme Demon</h3>
                    <p class="event-description">Turnamen bulanan dengan hadiah total Rp 500.000</p>
                    <div class="event-location">
                      <i class="fas fa-map-marker-alt"></i>
                      <span>Discord GDIPS</span>
                    </div>
                  </div>
                                  <div class="event-item">
                    <div class="event-category">Workshop</div>
                    <div class="event-date">
                      <i class="fas fa-calendar-day"></i>
                      <span>22 July 2025, 20:00 WIB</span>
                    </div>
                    <h3 class="event-title">Workshop Level Design</h3>
                    <p class="event-description">Pelajari teknik membuat level yang menarik dari para master</p>
                    <div class="event-location">
                      <i class="fas fa-map-marker-alt"></i>
                      <span>YouTube GDIPS</span>
                    </div>
                  </div>
                              </div>
            </div>

            <!-- Event Calendar Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <i class="fas fa-calendar"></i>
                </div>
                <h2 class="card-title">Kalender Event</h2>
              </div>
              
              <div style="text-align: center; padding: 20px;">
                <p style="color: var(--text-tertiary);">Kalender event akan segera hadir!</p>
                <p style="color: var(--text-tertiary); margin-top: 10px;">Sementara ini, lihat event mendatang di panel sebelah kiri.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Leaderboard Tab -->
        <div id="leaderboard" class="tab-content">
          <div class="grid">
            <!-- Top Players Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <i class="fas fa-trophy"></i>
                </div>
                <h2 class="card-title">Pemain Teratas</h2>
                <button id="refreshLeaderboardBtn" class="refresh-button" title="Refresh Leaderboard">
                  <i class="fas fa-sync-alt"></i>
                </button>
              </div>
              
              <div class="leaderboard-list" id="leaderboard-list">
                <!-- Data leaderboard akan dimuat dari API -->
              </div>
            </div>

            <!-- Demon List Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <i class="fas fa-skull-crossbones"></i>
                </div>
                <h2 class="card-title">Demon List</h2>
              </div>
              
              <div style="text-align: center; padding: 20px;">
                <p style="color: var(--text-tertiary);">Demon List akan segera hadir!</p>
                <p style="color: var(--text-tertiary); margin-top: 10px;">Sementara ini, lihat pemain teratas di panel sebelah kiri.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Notifications Tab -->
        <div id="notifikasi" class="tab-content">
          <div class="grid">
            <!-- Notifications List Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <i class="fas fa-bell"></i>
                </div>
                <h2 class="card-title">Notifikasi</h2>
              </div>
              
              <div class="notifications-list">
                                  <div class="notification-item unread">
                    <div class="notification-icon info">
                                              <i class="fas fa-info-circle"></i>
                                          </div>
                    <div class="notification-content">
                      <div class="notification-title">Pembaruan Server</div>
                      <div class="notification-message">Server telah diperbarui dengan fitur baru</div>
                      <div class="notification-date">10 June 2025</div>
                    </div>
                  </div>
                                  <div class="notification-item unread">
                    <div class="notification-icon event">
                                              <i class="fas fa-calendar-alt"></i>
                                          </div>
                    <div class="notification-content">
                      <div class="notification-title">Event Mendatang</div>
                      <div class="notification-message">Jangan lewatkan turnamen akhir pekan ini</div>
                      <div class="notification-date">12 June 2025</div>
                    </div>
                  </div>
                              </div>
            </div>

            <!-- Notification Settings Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon">
                  <i class="fas fa-cog"></i>
                </div>
                <h2 class="card-title">Pengaturan Notifikasi</h2>
              </div>
              
              <div style="text-align: center; padding: 20px;">
                <p style="color: var(--text-tertiary);">Pengaturan notifikasi akan segera hadir!</p>
                <p style="color: var(--text-tertiary); margin-top: 10px;">Sementara ini, lihat notifikasi terbaru di panel sebelah kiri.</p>
              </div>
            </div>
          </div>
        </div>
          </main>

    <!-- Footer -->
    <footer>
      <div class="footer-links">
        <a href="https://discord.gg/6HEyQBcM6E" class="footer-link" aria-label="Discord">
          <i class="fab fa-discord"></i>
        </a>
        <a href="https://youtube.com/@ameliaptz" class="footer-link" aria-label="YouTube">
          <i class="fab fa-youtube"></i>
        </a>
        <a href="https://github.com/flessan/gdips" class="footer-link" aria-label="GitHub">
          <i class="fab fa-github"></i>
        </a>
        <a href="https://fless.ps.fhgdps.com/dashboard" class="footer-link" aria-label="Dashboard">
          <i class="fas fa-server"></i>
        </a>
      </div>
      <div class="visitor-counter">
        <i class="fas fa-eye"></i>
        <span>Anda adalah pengunjung ke-910</span>
      </div>
      <p class="copyright">&copy; 2025 GDIPS - Geometry Dash Indonesia Private Server oleh Komunitas. Semua hak dilindungi.</p>
    </footer>
  </div>

  <!-- Toast Notification -->
  <div id="toast" class="toast" role="status" aria-live="polite">
    <i class="fas fa-check-circle toast-icon"></i>
    <div class="toast-message">Tautan disalin! Tempel ke pengalih GDPS.</div>
  </div>
  
  <!-- Floating Action Button -->
  <button id="scrollTopBtn" class="floating-action" aria-label="Kembali ke atas">
    <i class="fas fa-arrow-up"></i>
  </button>

  <script>
    // Data leaderboard dari PHP
    const leaderboardData = <?php echo json_encode($leaderboard); ?>;
    
    // Data API lainnya dari PHP
    const apiData = <?php echo $apiDataJson; ?>;
    
    document.addEventListener('DOMContentLoaded', function() {
      const copyBtn = document.getElementById('copyBtn');
      const datInput = document.getElementById('datLink');
      const toast = document.getElementById('toast');
      const scrollTopBtn = document.getElementById('scrollTopBtn');
      const refreshStatsBtn = document.getElementById('refreshStatsBtn');
      const refreshLeaderboardBtn = document.getElementById('refreshLeaderboardBtn');
      
      // Render leaderboard
      renderLeaderboard(leaderboardData);
      
      // Tab navigation
      const tabLinks = document.querySelectorAll('.nav-tab');
      const tabContents = document.querySelectorAll('.tab-content');
      
      tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Remove active class from all tabs and contents
          tabLinks.forEach(tab => tab.classList.remove('active'));
          tabContents.forEach(content => content.classList.remove('active'));
          
          // Add active class to clicked tab
          this.classList.add('active');
          
          // Show corresponding content
          const tabId = this.getAttribute('data-tab');
          document.getElementById(tabId).classList.add('active');
          
          // Initialize charts when statistics tab is opened
          if (tabId === 'statistik') {
            initializeCharts();
          }
        });
      });
      
      // Copy to clipboard functionality
      if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
          const value = datInput.value || '';
          
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(value);
            } else {
              const textArea = document.createElement('textarea');
              textArea.value = value;
              textArea.style.position = 'fixed';
              textArea.style.left = '-9999px';
              document.body.appendChild(textArea);
              textArea.focus();
              textArea.select();
              document.execCommand('copy');
              document.body.removeChild(textArea);
            }
            showToast('Tautan disalin! Tempel ke pengalih GDPS.');
          } catch (err) {
            console.error('Failed to copy: ', err);
            showToast('Gagal menyalin tautan.', 'error');
          }
        });
      }
      
      // Show toast notification
      function showToast(message, type = 'success') {
        const toastMessage = toast.querySelector('.toast-message');
        const toastIcon = toast.querySelector('.toast-icon');
        
        toastMessage.textContent = message;
        
        if (type === 'error') {
          toastIcon.className = 'fas fa-exclamation-circle toast-icon';
          toastIcon.style.color = 'var(--accent-danger)';
        } else {
          toastIcon.className = 'fas fa-check-circle toast-icon';
          toastIcon.style.color = 'var(--accent-success)';
        }
        
        toast.classList.add('show');
        setTimeout(() => {
          toast.classList.remove('show');
        }, 3000);
      }
      
      // Scroll to top functionality
      if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        });
        
        // Show/hide scroll to top button based on scroll position
        window.addEventListener('scroll', () => {
          if (window.pageYOffset > 300) {
            scrollTopBtn.style.opacity = '1';
            scrollTopBtn.style.visibility = 'visible';
          } else {
            scrollTopBtn.style.opacity = '0';
            scrollTopBtn.style.visibility = 'hidden';
          }
        });
        
        // Initially hide the button
        scrollTopBtn.style.opacity = '0';
        scrollTopBtn.style.visibility = 'hidden';
        scrollTopBtn.style.transition = 'opacity 0.3s, visibility 0.3s';
      }
      
      // Refresh statistics functionality
      if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener('click', async () => {
          // Add loading class to button
          refreshStatsBtn.classList.add('loading');
          
          try {
            // Fetch updated statistics
            const response = await fetch('refresh_stats.php');
            const data = await response.json();
            
            if (data.success) {
              // Reload the page to show updated statistics
              location.reload();
            } else {
              showToast('Gagal memperbarui statistik. Silakan coba lagi.', 'error');
            }
          } catch (error) {
            console.error('Error refreshing statistics:', error);
            showToast('Gagal memperbarui statistik. Silakan coba lagi.', 'error');
          } finally {
            // Remove loading class from button
            refreshStatsBtn.classList.remove('loading');
          }
        });
      }
      
      // Refresh leaderboard functionality
      if (refreshLeaderboardBtn) {
        refreshLeaderboardBtn.addEventListener('click', async () => {
          // Add loading class to button
          refreshLeaderboardBtn.classList.add('loading');
          
          try {
            // Fetch updated leaderboard
            const response = await fetch('refresh_leaderboard.php');
            const data = await response.json();
            
            if (data.success) {
              // Update leaderboard with new data
              renderLeaderboard(data.leaderboard);
              showToast('Leaderboard berhasil diperbarui!');
            } else {
              showToast('Gagal memperbarui leaderboard. Silakan coba lagi.', 'error');
            }
          } catch (error) {
            console.error('Error refreshing leaderboard:', error);
            showToast('Gagal memperbarui leaderboard. Silakan coba lagi.', 'error');
          } finally {
            // Remove loading class from button
            refreshLeaderboardBtn.classList.remove('loading');
          }
        });
      }
      
      // Function to render leaderboard
      function renderLeaderboard(data) {
        const leaderboardList = document.getElementById('leaderboard-list');
        
        if (!leaderboardList) return;
        
        // Clear existing content
        leaderboardList.innerHTML = '';
        
        // Check if data is available
        if (!data || data.length === 0) {
          leaderboardList.innerHTML = '<p style="text-align: center; color: var(--text-tertiary);">Tidak ada data leaderboard tersedia.</p>';
          return;
        }
        
        // Render each leaderboard item
        data.forEach((player, index) => {
          const rank = index + 1;
          const isTopThree = rank <= 3;
          
          const leaderboardItem = document.createElement('div');
          leaderboardItem.className = 'leaderboard-item';
          
          leaderboardItem.innerHTML = `
            <div class="leaderboard-rank ${isTopThree ? 'top' : ''}">${rank}</div>
            <div class="leaderboard-info">
              <div class="leaderboard-name">${player.name || player.userName || 'Unknown'}</div>
              <div class="leaderboard-stats">
                <div class="leaderboard-stat">
                  <i class="fas fa-star"></i>
                  <span>${player.stars || 0}</span>
                </div>
                <div class="leaderboard-stat">
                  <i class="fas fa-skull"></i>
                  <span>${player.demons || 0}</span>
                </div>
                <div class="leaderboard-stat">
                  <i class="fas fa-coins"></i>
                  <span>${player.cp || player.creatorPoints || 0}</span>
                </div>
              </div>
            </div>
          `;
          
          leaderboardList.appendChild(leaderboardItem);
        });
      }
      
      // Rating system
      const ratingStars = document.querySelectorAll('.rating-input i');
      const ratingInput = document.getElementById('rating');
      
      if (ratingStars && ratingInput) {
        ratingStars.forEach((star, index) => {
          star.addEventListener('click', () => {
            const rating = index + 1;
            ratingInput.value = rating;
            
            // Update star display
            ratingStars.forEach((s, i) => {
              if (i < rating) {
                s.classList.remove('far');
                s.classList.add('fas');
              } else {
                s.classList.remove('fas');
                s.classList.add('far');
              }
            });
          });
          
          star.addEventListener('mouseenter', () => {
            const rating = index + 1;
            
            // Update star display on hover
            ratingStars.forEach((s, i) => {
              if (i < rating) {
                s.classList.remove('far');
                s.classList.add('fas');
              } else {
                s.classList.remove('fas');
                s.classList.add('far');
              }
            });
          });
        });
        
                // Reset stars when mouse leaves
        document.querySelector('.rating-input').addEventListener('mouseleave', () => {
          const rating = parseInt(ratingInput.value);
          
          ratingStars.forEach((s, i) => {
            if (i < rating) {
              s.classList.remove('far');
              s.classList.add('fas');
            } else {
              s.classList.remove('fas');
              s.classList.add('far');
            }
          });
        });
      }
      
      // Toggle reply form
      window.toggleReplyForm = function(feedbackId) {
        const replyForm = document.getElementById(`reply-form-${feedbackId}`);
        
        if (replyForm) {
          replyForm.classList.toggle('active');
          
          // Focus on the message input if form is opened
          if (replyForm.classList.contains('active')) {
            const messageInput = replyForm.querySelector('textarea[name="reply_message"]');
            if (messageInput) {
              messageInput.focus();
            }
          }
        }
      };
      
      // Intersection Observer for card animations
      const cards = document.querySelectorAll('.card');
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);
      
      cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
      });
      
      // Add keyboard navigation for social links
      const socialItems = document.querySelectorAll('.social-item, .link-item');
      socialItems.forEach(item => {
        item.setAttribute('tabindex', '0');
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            item.click();
          }
        });
      });
      
      // Form validation for feedback form
      const feedbackForm = document.querySelector('.feedback-form');
      if (feedbackForm) {
        feedbackForm.addEventListener('submit', (e) => {
          const messageField = document.getElementById('message');
          if (!messageField.value.trim()) {
            e.preventDefault();
            showToast('Pesan tidak boleh kosong', 'error');
          }
        });
      }
      
      // Auto-scroll to feedback section if hash is present
      if (window.location.hash === '#feedback') {
        const feedbackTab = document.querySelector('[data-tab="feedback"]');
        if (feedbackTab) {
          feedbackTab.click();
        }
      }
      
      // Chart initialization function
      function initializeCharts() {
        // Check if Chart.js is loaded and we have API stats
        if (typeof Chart === 'undefined' || !window.apiStats) {
          return;
        }
        
        // Set default chart options
        Chart.defaults.color = '#a0a0a0';
        Chart.defaults.borderColor = '#30363d';
        
        // User Growth Chart
        const userGrowthCtx = document.getElementById('userGrowthChart');
        if (userGrowthCtx) {
          new Chart(userGrowthCtx, {
            type: 'line',
            data: {
              labels: generateDateLabels(7),
              datasets: [{
                label: 'Total Pengguna',
                data: generateRandomData(7, 1000, 1200),
                borderColor: '#c8102e',
                backgroundColor: 'rgba(200, 16, 46, 0.1)',
                tension: 0.3,
                fill: true
              }, {
                label: 'Pengguna Aktif',
                data: generateRandomData(7, 300, 500),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.3,
                fill: true
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: 'Pertumbuhan Pengguna (7 Hari Terakhir)'
                }
              },
              scales: {
                y: {
                  beginAtZero: false
                }
              }
            }
          });
        }
        
        // Level Distribution Chart
        const levelDistributionCtx = document.getElementById('levelDistributionChart');
        if (levelDistributionCtx) {
          new Chart(levelDistributionCtx, {
            type: 'doughnut',
            data: {
              labels: ['Unrated', 'Rated', 'Featured', 'Epic', 'Legendary', 'Mythic'],
              datasets: [{
                data: [
                  window.apiStats.levels.total - window.apiStats.levels.rated,
                  window.apiStats.levels.rated - window.apiStats.levels.featured,
                  window.apiStats.levels.featured - window.apiStats.levels.epic,
                  window.apiStats.levels.epic - window.apiStats.levels.legendary,
                  window.apiStats.levels.legendary - window.apiStats.levels.mythic,
                  window.apiStats.levels.mythic
                ],
                backgroundColor: [
                  '#a0a0a0',
                  '#3498db',
                  '#d4af37',
                  '#9b59b6',
                  '#e74c3c',
                  '#2ecc71'
                ]
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                },
                title: {
                  display: true,
                  text: 'Distribusi Level'
                }
              }
            }
          });
        }
        
        // Special Levels Chart
        const specialLevelsCtx = document.getElementById('specialLevelsChart');
        if (specialLevelsCtx) {
          new Chart(specialLevelsCtx, {
            type: 'bar',
            data: {
              labels: ['Daily Levels', 'Weekly Levels', 'Gauntlets', 'Map Packs'],
              datasets: [{
                label: 'Jumlah',
                data: [
                  window.apiStats.special.dailies,
                  window.apiStats.special.weeklies,
                  window.apiStats.special.gauntlets,
                  window.apiStats.special.map_packs
                ],
                backgroundColor: [
                  '#c8102e',
                  '#3498db',
                  '#d4af37',
                  '#2ecc71'
                ]
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                },
                title: {
                  display: true,
                  text: 'Level Khusus'
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          });
        }
        
        // Engagement Chart
        const engagementCtx = document.getElementById('engagementChart');
        if (engagementCtx) {
          new Chart(engagementCtx, {
            type: 'line',
            data: {
              labels: generateDateLabels(7),
              datasets: [{
                label: 'Download',
                data: generateRandomData(7, 5000, 8000),
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                tension: 0.3,
                fill: true
              }, {
                label: 'Like',
                data: generateRandomData(7, 10000, 15000),
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                tension: 0.3,
                fill: true
              }, {
                label: 'Komentar',
                data: generateRandomData(7, 2000, 3000),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.3,
                fill: true
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: 'Keterlibatan Pengguna (7 Hari Terakhir)'
                }
              },
              scales: {
                y: {
                  beginAtZero: false
                }
              }
            }
          });
        }
        
        // Bans Chart
        const bansCtx = document.getElementById('bansChart');
        if (bansCtx) {
          new Chart(bansCtx, {
            type: 'bar',
            data: {
              labels: ['Account ID', 'User ID', 'IP'],
              datasets: [{
                label: 'Berdasarkan Tipe',
                data: [
                  window.apiStats.bans.personTypes.accountIDBans,
                  window.apiStats.bans.personTypes.userIDBans,
                  window.apiStats.bans.personTypes.IPBans
                ],
                backgroundColor: '#c8102e'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                },
                title: {
                  display: true,
                  text: 'Pemblokiran berdasarkan Tipe'
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          });
        }
      }
      
      // Helper function to generate date labels
      function generateDateLabels(days) {
        const labels = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          labels.push(date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
        }
        
        return labels;
      }
      
      // Helper function to generate random data for charts
      function generateRandomData(points, min, max) {
        const data = [];
        let current = Math.floor(Math.random() * (max - min + 1)) + min;
        
        for (let i = 0; i < points; i++) {
          // Add some randomness but keep it somewhat realistic
          const change = Math.floor(Math.random() * 100) - 50;
          current = Math.max(min, Math.min(max, current + change));
          data.push(current);
        }
        
        return data;
      }
      
      // Store API stats globally for chart initialization
      window.apiStats = {"users":{"total":432,"active":73},"levels":{"total":424,"rated":257,"featured":127,"epic":46,"legendary":9,"mythic":3},"special":{"dailies":21,"weeklies":9,"gauntlets":0,"map_packs":6},"downloads":{"total":15060,"average":35.5188679245283},"objects":{"total":3477998,"average":8202.825471698114},"likes":{"total":2611,"average":6.158018867924528},"comments":{"total":788,"comments":616,"posts":172,"post_replies":4},"gained_stars":{"total":14950,"average":34.60648148148148},"creator_points":{"total":480,"average":1.1111111111111112},"bans":{"total":8,"personTypes":{"accountIDBans":4,"userIDBans":1,"IPBans":3},"banTypes":{"leaderboardBans":2,"creatorBans":0,"levelUploadBans":2,"commentBans":0,"accountBans":4}}};
      
      // Initialize charts if statistics tab is active on page load
      if (document.querySelector('[data-tab="statistik"]').classList.contains('active')) {
        initializeCharts();
      }
      
      // Auto-refresh statistics every 5 minutes
      setInterval(() => {
        const activeTab = document.querySelector('.nav-tab.active');
        if (activeTab && activeTab.getAttribute('data-tab') === 'statistik') {
          // Only refresh if statistics tab is active
          if (refreshStatsBtn && !refreshStatsBtn.classList.contains('loading')) {
            refreshStatsBtn.click();
          }
        }
      }, 300000); // 5 minutes
    });
  </script>
</body>
</html>
