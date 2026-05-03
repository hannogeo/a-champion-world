import { db, auth } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const countryNames = {
    "AD": "Andorra", "AE": "United Arab Emirates", "AL": "Albania", "AR": "Argentina", "AS": "American Samoa", "AT": "Austria", "AU": "Australia", "AX": "Åland", "BA": "Bosnia and Herzegovina", "BD": "Bangladesh", "BE": "Belgium", "BG": "Bulgaria", "BO": "Bolivia", "BR": "Brazil", "BT": "Bhutan", "BW": "Botswana", "CA": "Canada", "CC": "Cocos (Keeling) Islands", "CH": "Switzerland", "CL": "Chile", "CO": "Colombia", "CR": "Costa Rica", "CW": "Curaçao", "CX": "Christmas Island", "CY": "Cyprus", "CZ": "Czechia", "DE": "Germany", "DK": "Denmark", "DO": "Dominican Republic", "EC": "Ecuador", "EE": "Estonia", "ES": "Spain", "FI": "Finland", "FO": "Faroe Islands", "FR": "France", "GB": "United Kingdom", "GH": "Ghana", "GL": "Greenland", "GR": "Greece", "GT": "Guatemala", "GU": "Guam", "HK": "Hong Kong", "HR": "Croatia", "HU": "Hungary", "ID": "Indonesia", "IE": "Ireland", "IL": "Israel", "IM": "Isle of Man", "IN": "India", "IS": "Iceland", "IT": "Italy", "JE": "Jersey", "JO": "Jordan", "JP": "Japan", "KE": "Kenya", "KG": "Kyrgyzstan", "KH": "Cambodia", "KR": "South Korea", "KZ": "Kazakhstan", "LA": "Laos", "LB": "Lebanon", "LK": "Sri Lanka", "LS": "Lesotho", "LT": "Lithuania", "LU": "Luxembourg", "LV": "Latvia", "ME": "Montenegro", "MK": "North Macedonia", "MN": "Mongolia", "MP": "Northern Mariana Islands", "MX": "Mexico", "MY": "Malaysia", "NA": "Namibia", "NG": "Nigeria", "NL": "Netherlands", "NO": "Norway", "NP": "Nepal", "NZ": "New Zealand", "OM": "Oman", "PA": "Panama", "PE": "Peru", "PH": "Philippines", "PL": "Poland", "PR": "Puerto Rico", "PS": "Palestine", "PT": "Portugal", "PY": "Paraguay", "QA": "Qatar", "RE": "Réunion", "RO": "Romania", "RS": "Serbia", "RU": "Russia", "RW": "Rwanda", "SE": "Sweden", "SG": "Singapore", "SI": "Slovenia", "SK": "Slovakia", "SN": "Senegal", "ST": "São Tomé and Príncipe", "SZ": "Eswatini", "TH": "Thailand", "TN": "Tunisia", "TR": "Turkey", "TW": "Taiwan", "UA": "Ukraine", "UG": "Uganda", "US": "United States", "UY": "Uruguay", "VI": "US Virgin Islands", "VN": "Vietnam", "ZA": "South Africa"
};

const rawData = `AD	5
AE	113
AL	134
AR	6987
AS	1
AT	174
AU	7012
AX  2
BA	134
BD	724
BE	144
BG	621
BO	927
BR	7631
BT	145
BW	877
CA	7013
CC	1
CH	154
CL	1238
CO	1234
CR	186
CW	1
CX	1
CY	52
CZ	164
DE	928
DK	186
DO	37
EC	516
EE	155
ES	922
FI	928
FO	9
FR	917
GB	929
GH	362
GL	163
GR	928
GT	208
GU	2
HK	3
HR	133
HU	173
ID	6360
IE	185
IL	94
IM	2
IN	4950
IS	237
IT	928
JE	1
JO	72
JP	2990
KE	990
KG	183
KH	639
KR	206
KZ	1319
LA	12
LB	17
LK	185
LS	104
LT	156
LU	13
LV	155
ME	123
MK	105
MN	1136
MP	2
MX	4641
MY	1333
NA	1030
NG	986
NL	185
NO	929
NP	599
NZ	1014
OM	1030
PA	186
PE	1289
PH	1393
PL	775
PR	62
PS	46
PT	590
PY	969
QA	62
RE	3
RO	721
RS	176
RU	9489
RW	52
SE	927
SG	3
SI	107
SK	175
SN	494
ST	11
SZ	103
TH	1346
TN	144
TR	1543
TW	164
UA	994
UG	16
US	8042
UY	409
VI	1
VN	1239
ZA	2062`;

const rawCountries = rawData.split('\n').map(line => {
    const [code, count] = line.trim().split(/\s+/);
    return {
        code: code.toLowerCase(),
        name: countryNames[code] || code,
        count: parseInt(count, 10)
    };
});

let countries = [...rawCountries].sort((a, b) => b.count - a.count);
let totalLocations = 0;
let isAdmin = false;

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

// Firebase Auth Listener
onAuthStateChanged(auth, (user) => {
    isAdmin = !!user;
    if(countryGrid) renderCountries(countrySearch ? countrySearch.value : '');
});

// Load Overrides
async function loadData() {
    try {
        const docSnap = await getDoc(doc(db, "data", "countryOverrides"));
        if (docSnap.exists()) {
            const overrides = docSnap.data();
            countries.forEach(c => {
                if (overrides[c.code] !== undefined) {
                    c.count = parseInt(overrides[c.code], 10);
                }
            });
            sortData(countries, sortSelect ? sortSelect.value : 'amount-desc');
        }
    } catch(e) {
        console.error(e);
    }
    
    updateTotalLocations();
    if(countryGrid) renderCountries();
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
        
        const countHtml = isAdmin 
            ? `<span class="loc-count-edit" data-country-code="${country.code}" contenteditable="true" style="border-bottom: 1px dashed var(--accent-primary); outline: none;">${country.count}</span>` 
            : `${country.count.toLocaleString()}`;

        const card = document.createElement('div');
        card.className = 'country-card';
        card.innerHTML = `
            <img src="https://flagcdn.com/w80/${country.code}.png" alt="${country.name}" class="flag">
            <div class="country-info">
                <div class="country-name">
                    <span>${country.name}</span>
                    <span class="loc-count">${countHtml} (${percentage}%)</span>
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

function renderMap() {
    if (!geoJsonData || !map) return;
    if (countryLayer) map.removeLayer(countryLayer);

    countryLayer = L.geoJson(geoJsonData, {
        style: (feature) => {
            const code = feature.properties.iso_a2 ? feature.properties.iso_a2.toLowerCase() : '';
            const country = countries.find(c => c.code === code);
            const hasData = !!country;

            return {
                fillColor: hasData ? 'var(--accent-primary)' : '#d1d1d1',
                weight: 1,
                opacity: 1,
                color: 'var(--border-dim)',
                fillOpacity: hasData ? 0.7 : 0.2
            };
        },
        onEachFeature: (feature, layer) => {
            const code = feature.properties.iso_a2 ? feature.properties.iso_a2.toLowerCase() : '';
            const country = countries.find(c => c.code === code);
            if (country) {
                const percentage = ((country.count / totalLocations) * 100).toFixed(2);
                layer.bindPopup(`
                    <div style="font-family: 'Outfit', sans-serif; text-align: center;">
                        <strong style="font-size: 1.1rem;">${country.name}</strong><br>
                        <span style="font-size: 1.3rem; color: var(--accent-primary); font-weight: 800;">${country.count.toLocaleString()}</span> locations<br>
                        <span style="font-size: 0.9rem; color: var(--text-secondary);">${percentage}% of map</span>
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

// Update initial render logic to handle map update
onAuthStateChanged(auth, (user) => {
    isAdmin = !!user;
    if(countryGrid) renderCountries(countrySearch ? countrySearch.value : '');
    if(map) renderMap();
});

// Update updateTotalLocations to also refresh map if visible
const originalUpdateTotal = updateTotalLocations;
updateTotalLocations = function() {
    originalUpdateTotal();
    if (map && mapView.style.display !== 'none') renderMap();
};

// Initial render logic
updateTotalLocations();
if(countryGrid) {
    renderCountries();
    
    // Update total locations in real-time as admin types
    countryGrid.addEventListener('input', (e) => {
        if (e.target.classList.contains('loc-count-edit')) {
            const code = e.target.getAttribute('data-country-code');
            const newCount = parseInt(e.target.innerText.replace(/,/g, ''), 10) || 0;
            
            const country = countries.find(c => c.code === code);
            if (country) {
                country.count = newCount;
                updateTotalLocations();
            }
        }
    });
}
loadData();


