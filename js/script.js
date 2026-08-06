let countryNames = {};

async function loadCountryNames() {
    try {
        const res = await fetch('https://flagcdn.com/en/codes.json');
        if (res.ok) countryNames = await res.json();
    } catch (e) {
        console.error('Failed to load country names from flagcdn:', e);
    }
}

let countries = [];
let totalLocations = 0;

function buildCountries(text) {
    return text.split('\n').map(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 2) return null;
        const code = parts[0].toUpperCase();
        const count = parseInt(parts[1], 10);
        if (!code || isNaN(count)) return null;
        return {
            code: code.toLowerCase(),
            name: countryNames[code.toLowerCase()] || code,
            count
        };
    }).filter(Boolean);
}

const countryGrid = document.getElementById('countryGrid');
const countrySearch = document.getElementById('countrySearch');
const totalLocationsDisplay = document.getElementById('totalLocationsDisplay');
const sortSelect = document.getElementById('sortSelect');

function updateTotalLocations() {
    totalLocations = countries.reduce((acc, curr) => acc + curr.count, 0);
    if (totalLocationsDisplay) {
        totalLocationsDisplay.textContent = totalLocations.toLocaleString();
    }
}

// Load Distribution from GitHub
const DIST_REPO = 'hannogeo/achw-distribution';
const STORAGE_KEY = 'achwDistributionCache';

async function fetchDistributionText() {
    const res = await fetch(`https://api.github.com/repos/${DIST_REPO}/contents/`);
    if (!res.ok) throw new Error('Failed to list distribution repo');
    const files = await res.json();
    const candidates = files
        .filter(f => f.type === 'file' && /^\d+-distribution\.txt$/.test(f.name))
        .map(f => ({ num: parseInt(f.name, 10), url: f.download_url }))
        .sort((a, b) => b.num - a.num);
    if (candidates.length === 0) throw new Error('No distribution file found');
    const rawRes = await fetch(candidates[0].url);
    if (!rawRes.ok) throw new Error('Failed to fetch distribution file');
    return await rawRes.text();
}

async function loadDistribution() {
    const namesPromise = loadCountryNames();

    let text = null;
    try {
        text = await fetchDistributionText();
        try { localStorage.setItem(STORAGE_KEY, text); } catch (e) {}
    } catch (e) {
        console.error('GitHub distribution unavailable, using cached copy:', e);
        try { text = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    }

    await namesPromise;
    countries = buildCountries(text || '');

    sortData(countries, sortSelect ? sortSelect.value : 'amount-desc');
    updateTotalLocations();
    if (countryGrid) renderCountries();
}

function renderCountries(filter = '') {
    countryGrid.innerHTML = '';

    let filtered = countries.filter(c =>
        c.name.toLowerCase().includes(filter.toLowerCase()) ||
        c.code.toLowerCase().includes(filter.toLowerCase())
    );

    sortData(filtered, sortSelect.value);

    filtered.forEach(country => {
        const percentage = ((country.count / totalLocations) * 100).toFixed(2);
        const countHtml = country.count.toLocaleString();

        const card = document.createElement('div');
        card.className = 'country-card';
        card.innerHTML = `
            <img src="https://flagcdn.com/w80/${country.code}.png" alt="${country.name}" class="flag">
            <div class="country-info">
                <div class="country-name">${country.name}</div>
                <div class="country-stats">
                    <span class="loc-count">${countHtml}</span>
                    <span class="loc-percent">${percentage}%</span>
                </div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
        `;

        countryGrid.appendChild(card);

        setTimeout(() => {
            const maxCount = countries[0].count;
            const relativeWidth = (country.count / maxCount) * 100;
            card.querySelector('.progress-bar').style.width = `${Math.max(relativeWidth, 1)}%`;
        }, 50);
    });
}

function sortData(arr, sortValue) {
    if (sortValue === 'amount-desc') {
        arr.sort((a, b) => b.count - a.count);
    } else if (sortValue === 'amount-asc') {
        arr.sort((a, b) => a.count - b.count);
    } else if (sortValue === 'name-asc') {
        arr.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortValue === 'name-desc') {
        arr.sort((a, b) => b.name.localeCompare(a.name));
    }
}

countrySearch?.addEventListener('input', (e) => {
    renderCountries(e.target.value);
});

sortSelect?.addEventListener('change', () => {
    renderCountries(countrySearch.value);
});

// Map Variables
let map;
let geoJsonData;
let countryLayer;
const mapView = document.getElementById('mapView');
const showListBtn = document.getElementById('show-list');
const showMapBtn = document.getElementById('show-map');

function initMap() {
    if (map) return;

    map = L.map('mapView', {
        minZoom: 2,
        maxZoom: 6,
        worldCopyJump: true
    }).setView([20, 0], 2);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
        .then(res => res.json())
        .then(data => {
            geoJsonData = data;
            renderMap();
        });
}

function resolveGeoCode(feature) {
    const raw = feature.properties.iso_a2 ? feature.properties.iso_a2.toLowerCase() : '';
    const overrides = { '-99': 'xk' };
    const wb = (feature.properties.wb_a2 || '').toLowerCase();
    if (raw === '-99' && wb && countries.find(c => c.code === wb)) return wb;
    return overrides[raw] || raw;
}

function renderMap() {
    if (!geoJsonData || !map) return;
    if (countryLayer) map.removeLayer(countryLayer);

    countryLayer = L.geoJson(geoJsonData, {
        style: (feature) => {
            const code = resolveGeoCode(feature);
            const country = countries.find(c => c.code === code);
            const hasData = !!country;

            return {
                fillColor: hasData ? 'var(--accent-primary)' : '#2a2f3a',
                weight: 1,
                opacity: 1,
                color: 'var(--border-dim)',
                fillOpacity: hasData ? 0.7 : 0.15
            };
        },
        onEachFeature: (feature, layer) => {
            const code = resolveGeoCode(feature);
            const country = countries.find(c => c.code === code);
            if (country) {
                const percentage = ((country.count / totalLocations) * 100).toFixed(2);
                layer.bindPopup(`
                    <div style="text-align: center; line-height: 1.6;">
                        <strong style="font-size: 1.05rem;">${country.name}</strong><br>
                        <span style="font-size: 1.3rem; color: var(--accent-primary); font-weight: 700;">${country.count.toLocaleString()}</span> locations<br>
                        <span style="font-size: 0.85rem; color: var(--text-secondary);">${percentage}% of map</span>
                    </div>
                `, { closeButton: false });

                layer.on({
                    mouseover: (e) => {
                        const l = e.target;
                        l.setStyle({ fillOpacity: 0.9, weight: 2 });
                    },
                    mouseout: (e) => {
                        const l = e.target;
                        l.setStyle({ fillOpacity: 0.7, weight: 1 });
                    }
                });
            }
        }
    }).addTo(map);
}

// Toggle View Logic
showListBtn?.addEventListener('click', () => {
    showListBtn.classList.add('active');
    showMapBtn.classList.remove('active');
    countryGrid.style.display = 'grid';
    mapView.style.display = 'none';
});

showMapBtn?.addEventListener('click', () => {
    showMapBtn.classList.add('active');
    showListBtn.classList.remove('active');
    countryGrid.style.display = 'none';
    mapView.style.display = 'block';

    if (!map) {
        initMap();
    } else {
        renderMap();
        setTimeout(() => map.invalidateSize(), 100);
    }
});

// Re-render the map too when totals are updated (if map view is visible)
const originalUpdateTotal = updateTotalLocations;
updateTotalLocations = function() {
    originalUpdateTotal();
    if (map && mapView.style.display !== 'none') renderMap();
};

loadDistribution();
