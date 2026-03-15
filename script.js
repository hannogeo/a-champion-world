const countryNames = {
    "AD": "Andorra", "AE": "United Arab Emirates", "AL": "Albania", "AR": "Argentina", "AS": "American Samoa", "AT": "Austria", "AU": "Australia", "BA": "Bosnia and Herzegovina", "BD": "Bangladesh", "BE": "Belgium", "BG": "Bulgaria", "BO": "Bolivia", "BR": "Brazil", "BT": "Bhutan", "BW": "Botswana", "CA": "Canada", "CC": "Cocos (Keeling) Islands", "CH": "Switzerland", "CL": "Chile", "CO": "Colombia", "CR": "Costa Rica", "CW": "Curaçao", "CX": "Christmas Island", "CY": "Cyprus", "CZ": "Czechia", "DE": "Germany", "DK": "Denmark", "DO": "Dominican Republic", "EC": "Ecuador", "EE": "Estonia", "ES": "Spain", "FI": "Finland", "FO": "Faroe Islands", "FR": "France", "GB": "United Kingdom", "GH": "Ghana", "GL": "Greenland", "GR": "Greece", "GT": "Guatemala", "GU": "Guam", "HK": "Hong Kong", "HR": "Croatia", "HU": "Hungary", "ID": "Indonesia", "IE": "Ireland", "IL": "Israel", "IM": "Isle of Man", "IN": "India", "IS": "Iceland", "IT": "Italy", "JE": "Jersey", "JO": "Jordan", "JP": "Japan", "KE": "Kenya", "KG": "Kyrgyzstan", "KH": "Cambodia", "KR": "South Korea", "KZ": "Kazakhstan", "LA": "Laos", "LB": "Lebanon", "LK": "Sri Lanka", "LS": "Lesotho", "LT": "Lithuania", "LU": "Luxembourg", "LV": "Latvia", "ME": "Montenegro", "MK": "North Macedonia", "MN": "Mongolia", "MP": "Northern Mariana Islands", "MX": "Mexico", "MY": "Malaysia", "NA": "Namibia", "NG": "Nigeria", "NL": "Netherlands", "NO": "Norway", "NP": "Nepal", "NZ": "New Zealand", "OM": "Oman", "PA": "Panama", "PE": "Peru", "PH": "Philippines", "PL": "Poland", "PR": "Puerto Rico", "PS": "Palestine", "PT": "Portugal", "PY": "Paraguay", "QA": "Qatar", "RE": "Réunion", "RO": "Romania", "RS": "Serbia", "RU": "Russia", "RW": "Rwanda", "SE": "Sweden", "SG": "Singapore", "SI": "Slovenia", "SK": "Slovakia", "SN": "Senegal", "ST": "São Tomé and Príncipe", "SZ": "Eswatini", "TH": "Thailand", "TN": "Tunisia", "TR": "Turkey", "TW": "Taiwan", "UA": "Ukraine", "UG": "Uganda", "US": "United States", "UY": "Uruguay", "VI": "US Virgin Islands", "VN": "Vietnam", "ZA": "South Africa"
};

const rawData = `AD	5
AE	113
AL	134
AR	6987
AS	1
AT	174
AU	7012
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

const countries = rawData.split('\n').map(line => {
    const [code, count] = line.trim().split(/\s+/);
    return {
        code: code.toLowerCase(),
        name: countryNames[code] || code,
        count: parseInt(count, 10)
    };
}).sort((a, b) => b.count - a.count);

const totalLocations = countries.reduce((acc, curr) => acc + curr.count, 0);

const countryGrid = document.getElementById('countryGrid');
const countrySearch = document.getElementById('countrySearch');
const totalLocationsDisplay = document.getElementById('totalLocationsDisplay');
const sortSelect = document.getElementById('sortSelect');

if (totalLocationsDisplay) {
    totalLocationsDisplay.textContent = totalLocations.toLocaleString();
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
        
        const card = document.createElement('div');
        card.className = 'country-card';
        card.innerHTML = `
            <img src="https://flagcdn.com/w80/${country.code}.png" alt="${country.name}" class="flag">
            <div class="country-info">
                <div class="country-name">
                    <span>${country.name}</span>
                    <span class="loc-count">${country.count.toLocaleString()} (${percentage}%)</span>
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

countrySearch.addEventListener('input', (e) => {
    renderCountries(e.target.value);
});

sortSelect.addEventListener('change', () => {
    renderCountries(countrySearch.value);
});

// Initial render
renderCountries();

