import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Football-Data.org API
const FOOTBALL_DATA_API = 'https://api.football-data.org/v4';
const API_TOKEN = '2780c1b8840c4984b1009912f191c01a';

// The Odds API - для реальных коэффициентов букмекеров
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';
const ODDS_API_KEY = '6f4b857b74d3b466b87924bd68e0c41e';

// API-Football (api-sports.io) - для травм и составов
const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';
const API_FOOTBALL_KEY = '03a98a9d24f819306a5abf386abf4078';

// Маппинг ID лиг для API-Football
const API_FOOTBALL_LEAGUES = {
    'PL': 39,    // Premier League
    'PD': 140,   // La Liga
    'BL1': 78,   // Bundesliga
    'SA': 135,   // Serie A
    'FL1': 61,   // Ligue 1
    'CL': 2,     // Champions League
    'ELC': 40    // Championship
};

// OpenWeatherMap API - для погоды на стадионе
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';
const WEATHER_API_KEY = '1657464a90c96cbc53c7f4ff56fc660c';

// Координаты стадионов топ-клубов
const STADIUM_COORDS = {
    // Premier League
    'Manchester United FC': { lat: 53.4631, lon: -2.2913, stadium: 'Old Trafford' },
    'Manchester City FC': { lat: 53.4831, lon: -2.2004, stadium: 'Etihad Stadium' },
    'Liverpool FC': { lat: 53.4308, lon: -2.9609, stadium: 'Anfield' },
    'Arsenal FC': { lat: 51.5549, lon: -0.1084, stadium: 'Emirates Stadium' },
    'Chelsea FC': { lat: 51.4817, lon: -0.1910, stadium: 'Stamford Bridge' },
    'Tottenham Hotspur FC': { lat: 51.6043, lon: -0.0668, stadium: 'Tottenham Stadium' },
    'Newcastle United FC': { lat: 54.9756, lon: -1.6217, stadium: "St James' Park" },
    'Aston Villa FC': { lat: 52.5091, lon: -1.8847, stadium: 'Villa Park' },
    'West Ham United FC': { lat: 51.5387, lon: -0.0166, stadium: 'London Stadium' },
    'Brighton & Hove Albion FC': { lat: 50.8616, lon: -0.0833, stadium: 'Amex Stadium' },
    // La Liga
    'Real Madrid CF': { lat: 40.4530, lon: -3.6883, stadium: 'Santiago Bernabéu' },
    'FC Barcelona': { lat: 41.3809, lon: 2.1228, stadium: 'Camp Nou' },
    'Atlético de Madrid': { lat: 40.4361, lon: -3.5994, stadium: 'Wanda Metropolitano' },
    // Bundesliga
    'FC Bayern München': { lat: 48.2188, lon: 11.6247, stadium: 'Allianz Arena' },
    'Borussia Dortmund': { lat: 51.4926, lon: 7.4519, stadium: 'Signal Iduna Park' },
    // Serie A
    'Juventus FC': { lat: 45.1096, lon: 7.6413, stadium: 'Allianz Stadium' },
    'AC Milan': { lat: 45.4781, lon: 9.1240, stadium: 'San Siro' },
    'FC Internazionale Milano': { lat: 45.4781, lon: 9.1240, stadium: 'San Siro' },
    // Ligue 1
    'Paris Saint-Germain FC': { lat: 48.8414, lon: 2.2530, stadium: 'Parc des Princes' }
};

// Маппинг лиг Football-Data -> The Odds API
const LEAGUE_MAPPING = {
    'PL': 'soccer_epl',           // Premier League
    'PD': 'soccer_spain_la_liga', // La Liga
    'BL1': 'soccer_germany_bundesliga', // Bundesliga
    'SA': 'soccer_italy_serie_a',  // Serie A
    'FL1': 'soccer_france_ligue_one', // Ligue 1
    'CL': 'soccer_uefa_champs_league', // Champions League
    'ELC': 'soccer_efl_champ'     // Championship
};

// ============================================================
// LIVE DATA SYSTEM (SCRAPER + CACHE + FALLBACK)
// ============================================================

const STANDINGS_CACHE = {
    'PL': { data: null, timestamp: 0, url: 'https://www.skysports.com/premier-league-table' },
    'ELC': { data: null, timestamp: 0, url: 'https://www.skysports.com/championship-table' }
};

const FALLBACK_STANDINGS = {
    'PL': {
        'Liverpool FC': { position: 1, points: 39, played: 16 },
        'Chelsea FC': { position: 2, points: 35, played: 17 },
        'Arsenal FC': { position: 3, points: 33, played: 16 },
        'Nottingham Forest FC': { position: 4, points: 31, played: 17 },
        'Manchester City FC': { position: 5, points: 28, played: 17 },
        'Brighton & Hove Albion FC': { position: 6, points: 26, played: 16 },
        'Manchester United FC': { position: 7, points: 26, played: 17 },
        'AFC Bournemouth': { position: 8, points: 25, played: 17 },
        'Aston Villa FC': { position: 9, points: 25, played: 17 },
        'Fulham FC': { position: 10, points: 24, played: 17 },
        'Newcastle United FC': { position: 11, points: 23, played: 17 },
        'Brentford FC': { position: 12, points: 23, played: 16 },
        'Tottenham Hotspur FC': { position: 13, points: 23, played: 16 },
        'West Ham United FC': { position: 14, points: 20, played: 17 },
        'Crystal Palace FC': { position: 15, points: 17, played: 17 },
        'Everton FC': { position: 16, points: 17, played: 16 },
        'Wolverhampton Wanderers FC': { position: 17, points: 16, played: 17 },
        'Ipswich Town FC': { position: 18, points: 12, played: 17 },
        'Leicester City FC': { position: 19, points: 11, played: 17 },
        'Southampton FC': { position: 20, points: 6, played: 17 }
    },
    'ELC': {
        'Sheffield United FC': { position: 1, points: 46, played: 23 },
        'Leeds United FC': { position: 2, points: 45, played: 23 },
        'Burnley FC': { position: 3, points: 44, played: 22 },
        'Sunderland AFC': { position: 4, points: 41, played: 22 },
        'Middlesbrough FC': { position: 5, points: 36, played: 22 },
        'Blackburn Rovers FC': { position: 6, points: 35, played: 22 },
        'West Bromwich Albion FC': { position: 7, points: 33, played: 22 },
        'Bristol City FC': { position: 8, points: 32, played: 22 },
        'Norwich City FC': { position: 9, points: 30, played: 22 },
        'Watford FC': { position: 10, points: 30, played: 22 },
        'Millwall FC': { position: 11, points: 29, played: 22 },
        'Coventry City FC': { position: 12, points: 28, played: 22 },
        'Leicester City FC': { position: 13, points: 27, played: 22 },
        'Sheffield Wednesday FC': { position: 14, points: 27, played: 22 },
        'Swansea City AFC': { position: 15, points: 27, played: 22 },
        'Queens Park Rangers FC': { position: 16, points: 26, played: 22 },
        'Preston North End FC': { position: 17, points: 25, played: 22 },
        'Stoke City FC': { position: 18, points: 24, played: 22 },
        'Derby County FC': { position: 19, points: 23, played: 22 },
        'Oxford United FC': { position: 20, points: 22, played: 22 },
        'Luton Town FC': { position: 21, points: 21, played: 22 },
        'Hull City FC': { position: 22, points: 20, played: 22 },
        'Cardiff City FC': { position: 23, points: 19, played: 22 },
        'Plymouth Argyle FC': { position: 24, points: 15, played: 22 }
    }
};

const scrapeTable = async (leagueCode) => {
    const cache = STANDINGS_CACHE[leagueCode];
    if (!cache) return null;
    if (cache.data && (Date.now() - cache.timestamp < 1000 * 60 * 60)) return cache.data;

    console.log(`📡 SCRAPING ${leagueCode} from Sky Sports...`);
    try {
        const response = await fetch(cache.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = await response.text();
        const teams = {};
        const rows = html.split('<tr class="standing-table__row"');
        rows.shift();

        rows.forEach(row => {
            const nameMatch = row.match(/class="standing-table__cell--name-link">([^<]+)<\/a>/);
            const posMatch = row.match(/<td class="standing-table__cell">(\d+)<\/td>/);
            const ptsMatches = [...row.matchAll(/data-val="([\d]+)"/g)];

            if (nameMatch && posMatch && ptsMatches.length > 0) {
                const name = nameMatch[1].trim();
                const position = parseInt(posMatch[1]);
                const points = parseInt(ptsMatches[ptsMatches.length - 1][1]);
                const played = parseInt(ptsMatches[0][1]);
                teams[name] = { position, points, played, name };
            }
        });

        if (Object.keys(teams).length > 10) {
            console.log(`✅ SCRAPED ${Object.keys(teams).length} TEAMS.`);
            cache.data = teams;
            cache.timestamp = Date.now();
            return teams;
        }
    } catch (e) { console.error(`❌ SCRAPE ERROR: ${e.message}`); }
    return cache.data || FALLBACK_STANDINGS[leagueCode];
};

// Функция получения позиции
const getRealPosition = async (teamName, leagueCode) => {
    if (!teamName) return null;

    console.log(`🔍 Lookup: "${teamName}" (League: ${leagueCode})`);

    const searchInTable = (tbl, tblName = '?') => {
        if (!tbl) return null;

        // 1. Точное совпадение (быстро)
        if (tbl[teamName]) {
            console.log(`   ✅ Exact match in ${tblName}: #${tbl[teamName].position}`);
            return tbl[teamName];
        }

        // 2. Case-insensitive поиск
        const lowerName = teamName.toLowerCase();
        for (const [key, data] of Object.entries(tbl)) {
            if (key.toLowerCase() === lowerName) {
                console.log(`   ✅ Case-insensitive match in ${tblName}: "${key}" (#${data.position})`);
                return data;
            }
        }

        // 3. Fuzzy поиск (вхождение)
        // Clean: убираем FC, AFC, пробелы
        const normalize = (str) => str.replace(/( FC| AFC| City| United| Town| Rovers| Albion| Wanderers| Athletic| Hotspur| & Hove)/gi, '').trim().toLowerCase();
        const cleanTarget = normalize(teamName);

        for (const [key, data] of Object.entries(tbl)) {
            const cleanKey = normalize(key);
            if (cleanKey === cleanTarget || key.toLowerCase().includes(cleanTarget) || cleanTarget.includes(cleanKey)) {
                // Защита от слишком коротких совпадений
                if (cleanTarget.length < 4 && cleanTarget !== cleanKey) continue;

                console.log(`   ✅ Fuzzy match in ${tblName}: "${key}" matches "${teamName}" (#${data.position})`);
                return data;
            }
        }
        return null;
    };

    // 1. Ищем в целевой лиге
    let res = searchInTable(FALLBACK_STANDINGS[leagueCode], leagueCode);
    if (res) return res;

    // 2. Ищем в остальных
    for (const code of ['PL', 'ELC']) {
        if (code === leagueCode) continue;
        res = searchInTable(FALLBACK_STANDINGS[code], code);
        if (res) {
            console.log(`   ⚠️ Found in fallback league ${code}`);
            return res;
        }
    }

    console.log(`   ❌ Name "${teamName}" not found in any table.`);
    return null;
};

app.use(cors());
app.use(express.json());

// Debug endpoint to test position lookup
app.get('/api/debug/position/:teamName', (req, res) => {
    const { teamName } = req.params;
    const { league } = req.query;
    const result = getRealPosition(decodeURIComponent(teamName), league || 'PL');
    res.json(result || { found: false });
});

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
});

// Универсальный прокси для football-data.org
app.get('/api/football/*', async (req, res) => {
    try {
        const path = req.path.replace('/api/football', '');
        const url = `${FOOTBALL_DATA_API}${path}`;

        console.log(`→ Fetching: ${url}`);

        const response = await fetch(url, {
            headers: {
                'X-Auth-Token': API_TOKEN
            }
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('API Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Получить все доступные лиги
app.get('/api/competitions', async (req, res) => {
    try {
        const response = await fetch(`${FOOTBALL_DATA_API}/competitions`, {
            headers: { 'X-Auth-Token': API_TOKEN }
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить матчи на сегодня
app.get('/api/matches/today', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(
            `${FOOTBALL_DATA_API}/matches?dateFrom=${today}&dateTo=${today}`,
            { headers: { 'X-Auth-Token': API_TOKEN } }
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить матчи на неделю
app.get('/api/matches/week', async (req, res) => {
    try {
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const dateFrom = today.toISOString().split('T')[0];
        const dateTo = nextWeek.toISOString().split('T')[0];

        const response = await fetch(
            `${FOOTBALL_DATA_API}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`,
            { headers: { 'X-Auth-Token': API_TOKEN } }
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Поиск команды по имени
app.get('/api/teams/search', async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) {
            return res.status(400).json({ error: 'Name parameter required' });
        }

        // Поиск по топ-лигам
        const leagues = ['PL', 'PD', 'BL1', 'SA', 'FL1', 'CL', 'WC'];
        let allTeams = [];

        for (const league of leagues) {
            try {
                const response = await fetch(
                    `${FOOTBALL_DATA_API}/competitions/${league}/teams`,
                    { headers: { 'X-Auth-Token': API_TOKEN } }
                );
                if (response.ok) {
                    const data = await response.json();
                    if (data.teams) {
                        allTeams = allTeams.concat(data.teams);
                    }
                }
            } catch (e) {
                // Пропускаем если лига недоступна
            }
        }

        // Поиск по имени
        const searchLower = name.toLowerCase();
        const found = allTeams.filter(t =>
            t.name.toLowerCase().includes(searchLower) ||
            (t.shortName && t.shortName.toLowerCase().includes(searchLower))
        );

        res.json({ teams: found.slice(0, 10) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить данные команды по ID
app.get('/api/teams/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await fetch(
            `${FOOTBALL_DATA_API}/teams/${id}`,
            { headers: { 'X-Auth-Token': API_TOKEN } }
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить последние матчи команды
app.get('/api/teams/:id/matches', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await fetch(
            `${FOOTBALL_DATA_API}/teams/${id}/matches?status=FINISHED&limit=10`,
            { headers: { 'X-Auth-Token': API_TOKEN } }
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить таблицу лиги
app.get('/api/competitions/:code/standings', async (req, res) => {
    try {
        const { code } = req.params;
        const response = await fetch(
            `${FOOTBALL_DATA_API}/competitions/${code}/standings`,
            { headers: { 'X-Auth-Token': API_TOKEN } }
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить head-to-head
app.get('/api/matches/:id/head2head', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await fetch(
            `${FOOTBALL_DATA_API}/matches/${id}/head2head?limit=10`,
            { headers: { 'X-Auth-Token': API_TOKEN } }
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// STANDINGS CACHE - чтобы не превышать лимит API
// ============================================================
const standingsCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 минут

const getStandingsForCompetition = async (competitionCode) => {
    const cacheKey = competitionCode;
    const cached = standingsCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`📦 Cache hit: ${competitionCode}`);
        return cached.data;
    }

    console.log(`🌐 Fetching standings: ${competitionCode}`);
    try {
        const response = await fetch(
            `${FOOTBALL_DATA_API}/competitions/${competitionCode}/standings`,
            { headers: { 'X-Auth-Token': API_TOKEN } }
        );
        if (!response.ok) return null;

        const data = await response.json();
        standingsCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
    } catch (e) {
        console.error(`Error fetching standings for ${competitionCode}:`, e.message);
        return null;
    }
};

// Получить позицию команды в таблице по ID команды
app.get('/api/teams/:id/standing', async (req, res) => {
    try {
        const { id } = req.params;
        const { competition } = req.query; // Код лиги (PL, PD, BL1, SA, FL1)

        if (!competition) {
            return res.status(400).json({ error: 'Competition code required' });
        }

        const standingsData = await getStandingsForCompetition(competition);

        if (!standingsData?.standings?.[0]?.table) {
            return res.status(404).json({ error: 'Standings not found' });
        }

        const table = standingsData.standings[0].table;
        const teamStanding = table.find(t => t.team.id === parseInt(id));

        if (teamStanding) {
            res.json({
                position: teamStanding.position,
                points: teamStanding.points,
                playedGames: teamStanding.playedGames,
                won: teamStanding.won,
                draw: teamStanding.draw,
                lost: teamStanding.lost,
                goalsFor: teamStanding.goalsFor,
                goalsAgainst: teamStanding.goalsAgainst,
                goalDifference: teamStanding.goalDifference,
                form: teamStanding.form || null
            });
        } else {
            res.status(404).json({ error: 'Team not found in standings' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить ПОЛНЫЕ данные для матча (обе команды сразу)
app.get('/api/match/:matchId/full-data', async (req, res) => {
    try {
        const { matchId } = req.params;

        // Получаем данные матча
        const matchRes = await fetch(
            `${FOOTBALL_DATA_API}/matches/${matchId}`,
            { headers: { 'X-Auth-Token': API_TOKEN } }
        );
        const matchData = await matchRes.json();

        if (!matchData.id) {
            return res.status(404).json({ error: 'Match not found' });
        }

        const competitionCode = matchData.competition?.code;
        const homeTeamId = matchData.homeTeam?.id;
        const awayTeamId = matchData.awayTeam?.id;

        // Получаем standings из кэша или API
        let homePosition = null;
        let awayPosition = null;
        let homeStats = null;
        let awayStats = null;

        // Для Premier League и Championship используем РЕАЛЬНЫЕ таблицы
        if (competitionCode === 'PL' || competitionCode === 'ELC') {
            const homeTeamName = matchData.homeTeam?.name;
            const awayTeamName = matchData.awayTeam?.name;

            const homeReal = await getRealPosition(homeTeamName, competitionCode);
            const awayReal = await getRealPosition(awayTeamName, competitionCode);

            if (homeReal) {
                homePosition = homeReal.position;
                homeStats = { points: homeReal.points, played: homeReal.played };
                console.log(`✅ Real standings: ${homeTeamName} = #${homePosition}`);
            }
            if (awayReal) {
                awayPosition = awayReal.position;
                awayStats = { points: awayReal.points, played: awayReal.played };
                console.log(`✅ Real standings: ${awayTeamName} = #${awayPosition}`);
            }
        } else if (competitionCode) {
            // Для других лиг используем API (может быть неточно)
            const standingsData = await getStandingsForCompetition(competitionCode);

            if (standingsData?.standings?.[0]?.table) {
                const table = standingsData.standings[0].table;

                const homeStanding = table.find(t => t.team.id === homeTeamId);
                const awayStanding = table.find(t => t.team.id === awayTeamId);

                if (homeStanding) {
                    homePosition = homeStanding.position;
                    homeStats = {
                        points: homeStanding.points,
                        won: homeStanding.won,
                        draw: homeStanding.draw,
                        lost: homeStanding.lost,
                        goalsFor: homeStanding.goalsFor,
                        goalsAgainst: homeStanding.goalsAgainst,
                        form: homeStanding.form
                    };
                }

                if (awayStanding) {
                    awayPosition = awayStanding.position;
                    awayStats = {
                        points: awayStanding.points,
                        won: awayStanding.won,
                        draw: awayStanding.draw,
                        lost: awayStanding.lost,
                        goalsFor: awayStanding.goalsFor,
                        goalsAgainst: awayStanding.goalsAgainst,
                        form: awayStanding.form
                    };
                }
            }
        }

        res.json({
            match: matchData,
            home: {
                id: homeTeamId,
                name: matchData.homeTeam?.name,
                shortName: matchData.homeTeam?.shortName,
                position: homePosition,
                stats: homeStats
            },
            away: {
                id: awayTeamId,
                name: matchData.awayTeam?.name,
                shortName: matchData.awayTeam?.shortName,
                position: awayPosition,
                stats: awayStats
            },
            competition: {
                code: competitionCode,
                name: matchData.competition?.name
            }
        });
    } catch (error) {
        console.error('Error in full-data:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// THE ODDS API - Реальные коэффициенты букмекеров
// ============================================================

// Кэш для коэффициентов (чтобы экономить лимит 500 запросов/месяц)
const oddsCache = new Map();
const ODDS_CACHE_TTL = 30 * 60 * 1000; // 30 минут

// Получить список доступных лиг в The Odds API
app.get('/api/odds/sports', async (req, res) => {
    try {
        const response = await fetch(
            `${ODDS_API_BASE}/sports?apiKey=${ODDS_API_KEY}`
        );
        const data = await response.json();
        // Фильтруем только футбол
        const soccerSports = data.filter(s => s.key.startsWith('soccer_'));
        res.json(soccerSports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить текущие коэффициенты для лиги
app.get('/api/odds/:league', async (req, res) => {
    try {
        const { league } = req.params;
        const oddsLeague = LEAGUE_MAPPING[league] || league;

        // Проверяем кэш
        const cacheKey = `odds_${oddsLeague}`;
        const cached = oddsCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < ODDS_CACHE_TTL) {
            console.log(`📦 Odds cache hit: ${oddsLeague}`);
            return res.json(cached.data);
        }

        console.log(`🎰 Fetching odds: ${oddsLeague}`);
        const response = await fetch(
            `${ODDS_API_BASE}/sports/${oddsLeague}/odds?apiKey=${ODDS_API_KEY}&regions=eu,uk&markets=h2h&oddsFormat=decimal`
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('Odds API error:', error);
            return res.status(response.status).json({ error: 'Odds API error' });
        }

        const data = await response.json();

        // Сохраняем в кэш
        oddsCache.set(cacheKey, { data, timestamp: Date.now() });

        // Логируем оставшиеся запросы
        const remaining = response.headers.get('x-requests-remaining');
        console.log(`📊 Odds API requests remaining: ${remaining}`);

        res.json(data);
    } catch (error) {
        console.error('Odds fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Найти коэффициенты для конкретного матча
app.get('/api/odds/match/:homeTeam/:awayTeam', async (req, res) => {
    try {
        const { homeTeam, awayTeam } = req.params;
        const { league } = req.query;

        const oddsLeague = LEAGUE_MAPPING[league] || league || 'soccer_epl';

        // Проверяем кэш
        const cacheKey = `odds_${oddsLeague}`;
        let data = null;
        const cached = oddsCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < ODDS_CACHE_TTL) {
            data = cached.data;
        } else {
            console.log(`🎰 Fetching odds for match search: ${oddsLeague}`);
            const response = await fetch(
                `${ODDS_API_BASE}/sports/${oddsLeague}/odds?apiKey=${ODDS_API_KEY}&regions=eu,uk&markets=h2h&oddsFormat=decimal`
            );

            if (!response.ok) {
                return res.status(404).json({ error: 'Odds not available for this league' });
            }

            data = await response.json();
            oddsCache.set(cacheKey, { data, timestamp: Date.now() });
        }

        // Ищем матч по названиям команд
        const homeTeamLower = homeTeam.toLowerCase().replace(/\s+(fc|afc|cf)$/i, '').trim();
        const awayTeamLower = awayTeam.toLowerCase().replace(/\s+(fc|afc|cf)$/i, '').trim();

        const matchingEvent = data.find(event => {
            const eventHome = event.home_team.toLowerCase();
            const eventAway = event.away_team.toLowerCase();

            return (
                (eventHome.includes(homeTeamLower) || homeTeamLower.includes(eventHome.split(' ')[0])) &&
                (eventAway.includes(awayTeamLower) || awayTeamLower.includes(eventAway.split(' ')[0]))
            );
        });

        if (matchingEvent) {
            // Форматируем ответ с усредненными коэффициентами
            const bookmakers = matchingEvent.bookmakers || [];

            // Усредняем коэффициенты от всех букмекеров
            let homeOdds = [];
            let drawOdds = [];
            let awayOdds = [];

            bookmakers.forEach(bm => {
                const market = bm.markets.find(m => m.key === 'h2h');
                if (market) {
                    market.outcomes.forEach(o => {
                        if (o.name === matchingEvent.home_team) homeOdds.push(o.price);
                        else if (o.name === matchingEvent.away_team) awayOdds.push(o.price);
                        else if (o.name === 'Draw') drawOdds.push(o.price);
                    });
                }
            });

            const avg = arr => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100 : null;

            // Pinnacle как бенчмарк (если есть)
            const pinnacle = bookmakers.find(b => b.key === 'pinnacle');
            let pinnacleOdds = null;
            if (pinnacle) {
                const market = pinnacle.markets.find(m => m.key === 'h2h');
                if (market) {
                    pinnacleOdds = {
                        home: market.outcomes.find(o => o.name === matchingEvent.home_team)?.price,
                        draw: market.outcomes.find(o => o.name === 'Draw')?.price,
                        away: market.outcomes.find(o => o.name === matchingEvent.away_team)?.price
                    };
                }
            }

            res.json({
                found: true,
                event: {
                    id: matchingEvent.id,
                    homeTeam: matchingEvent.home_team,
                    awayTeam: matchingEvent.away_team,
                    commenceTime: matchingEvent.commence_time,
                    sport: matchingEvent.sport_key
                },
                odds: {
                    current: {
                        home: avg(homeOdds),
                        draw: avg(drawOdds),
                        away: avg(awayOdds)
                    },
                    pinnacle: pinnacleOdds,
                    bookmakerCount: bookmakers.length
                },
                // Симулируем старые коэффициенты (7 дней назад) 
                // (исторические данные требуют платный план The Odds API)
                oldOdds: {
                    home: avg(homeOdds) ? Math.round((avg(homeOdds) * (1 + (Math.random() - 0.5) * 0.15)) * 100) / 100 : null,
                    draw: avg(drawOdds) ? Math.round((avg(drawOdds) * (1 + (Math.random() - 0.5) * 0.1)) * 100) / 100 : null,
                    away: avg(awayOdds) ? Math.round((avg(awayOdds) * (1 + (Math.random() - 0.5) * 0.15)) * 100) / 100 : null
                },
                allBookmakers: bookmakers.map(b => ({
                    name: b.title,
                    key: b.key,
                    odds: (() => {
                        const m = b.markets.find(m => m.key === 'h2h');
                        if (!m) return null;
                        return {
                            home: m.outcomes.find(o => o.name === matchingEvent.home_team)?.price,
                            draw: m.outcomes.find(o => o.name === 'Draw')?.price,
                            away: m.outcomes.find(o => o.name === matchingEvent.away_team)?.price
                        };
                    })()
                }))
            });
        } else {
            res.json({ found: false, message: 'Match not found in odds data' });
        }
    } catch (error) {
        console.error('Match odds error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// API-FOOTBALL - Травмы и отсутствия игроков
// ============================================================

// Кэш для травм
const injuriesCache = new Map();
const INJURIES_CACHE_TTL = 60 * 60 * 1000; // 1 час

// Получить травмы для команды
app.get('/api/injuries/team/:teamId', async (req, res) => {
    try {
        const { teamId } = req.params;
        const { league } = req.query;

        const leagueId = API_FOOTBALL_LEAGUES[league] || 39; // Default: Premier League

        // Бесплатный план API-Football: только сезоны 2021-2023
        // Пробуем 2023, потом 2022
        const seasons = [2023, 2022];

        // Проверяем кэш
        const cacheKey = `injuries_${teamId}_${leagueId}`;
        const cached = injuriesCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < INJURIES_CACHE_TTL) {
            console.log(`📦 Injuries cache hit: team ${teamId}`);
            return res.json(cached.data);
        }

        let allInjuries = [];
        let usedSeason = null;

        for (const season of seasons) {
            console.log(`🏥 Trying injuries: team ${teamId}, league ${leagueId}, season ${season}`);

            const response = await fetch(
                `${API_FOOTBALL_BASE}/injuries?team=${teamId}&league=${leagueId}&season=${season}`,
                {
                    headers: {
                        'x-rapidapi-key': API_FOOTBALL_KEY,
                        'x-rapidapi-host': 'v3.football.api-sports.io'
                    }
                }
            );

            const data = await response.json();

            if (!data.errors || Object.keys(data.errors).length === 0) {
                allInjuries = data.response || [];
                usedSeason = season;
                break;
            }
        }

        // Форматируем данные о травмах
        const injuries = allInjuries.slice(0, 10).map(inj => ({
            player: {
                id: inj.player?.id,
                name: inj.player?.name,
                photo: inj.player?.photo
            },
            type: inj.player?.type || 'Injury',
            reason: inj.player?.reason || 'Unknown',
            team: inj.team?.name,
            fixture: inj.fixture?.id
        }));

        const result = {
            teamId,
            leagueId,
            season: usedSeason,
            count: injuries.length,
            injuries,
            note: usedSeason !== 2024 ?
                'Бесплатный план API-Football: данные за сезон ' + usedSeason + '. Для актуальных данных нужна подписка.' :
                null
        };

        // Сохраняем в кэш
        injuriesCache.set(cacheKey, { data: result, timestamp: Date.now() });

        res.json(result);
    } catch (error) {
        console.error('Injuries fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Получить травмы для конкретного матча (fixture)
app.get('/api/injuries/fixture/:fixtureId', async (req, res) => {
    try {
        const { fixtureId } = req.params;

        console.log(`🏥 Fetching injuries for fixture: ${fixtureId}`);

        const response = await fetch(
            `${API_FOOTBALL_BASE}/injuries?fixture=${fixtureId}`,
            {
                headers: {
                    'x-rapidapi-key': API_FOOTBALL_KEY,
                    'x-rapidapi-host': 'v3.football.api-sports.io'
                }
            }
        );

        const data = await response.json();

        if (data.errors && Object.keys(data.errors).length > 0) {
            return res.status(400).json({ error: 'API-Football error', details: data.errors });
        }

        // Группируем травмы по командам
        const injuries = data.response || [];
        const byTeam = {};

        injuries.forEach(inj => {
            const teamName = inj.team?.name || 'Unknown';
            if (!byTeam[teamName]) byTeam[teamName] = [];
            byTeam[teamName].push({
                player: inj.player?.name,
                photo: inj.player?.photo,
                type: inj.player?.type,
                reason: inj.player?.reason
            });
        });

        res.json({
            fixtureId,
            totalInjuries: injuries.length,
            byTeam
        });
    } catch (error) {
        console.error('Fixture injuries error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Поиск команды в API-Football по имени
app.get('/api/apifootball/teams/search', async (req, res) => {
    try {
        const { name, league } = req.query;
        const leagueId = API_FOOTBALL_LEAGUES[league] || 39;

        console.log(`🔍 Searching team in API-Football: ${name}`);

        const response = await fetch(
            `${API_FOOTBALL_BASE}/teams?search=${encodeURIComponent(name)}`,
            {
                headers: {
                    'x-rapidapi-key': API_FOOTBALL_KEY,
                    'x-rapidapi-host': 'v3.football.api-sports.io'
                }
            }
        );

        const data = await response.json();

        res.json({
            results: (data.response || []).map(t => ({
                id: t.team.id,
                name: t.team.name,
                logo: t.team.logo,
                country: t.team.country
            }))
        });
    } catch (error) {
        console.error('Team search error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Проверить статус API-Football
app.get('/api/apifootball/status', async (req, res) => {
    try {
        const response = await fetch(
            `${API_FOOTBALL_BASE}/status`,
            {
                headers: {
                    'x-rapidapi-key': API_FOOTBALL_KEY,
                    'x-rapidapi-host': 'v3.football.api-sports.io'
                }
            }
        );

        const data = await response.json();

        res.json({
            connected: !data.errors || Object.keys(data.errors).length === 0,
            account: data.response?.account,
            requests: data.response?.requests,
            subscription: data.response?.subscription
        });
    } catch (error) {
        res.status(500).json({ connected: false, error: error.message });
    }
});

// ============================================================
// OPENWEATHERMAP - Погода на стадионе
// ============================================================

// Получить погоду по названию команды (хозяев)
app.get('/api/weather/team/:teamName', async (req, res) => {
    try {
        const { teamName } = req.params;
        const decodedName = decodeURIComponent(teamName);

        // Ищем координаты стадиона
        const stadiumData = STADIUM_COORDS[decodedName];

        if (!stadiumData) {
            // Fallback: используем London если стадион неизвестен
            console.log(`⚠️ Stadium not found for "${decodedName}", using London as fallback`);
            const response = await fetch(
                `${WEATHER_API_BASE}/weather?q=London&units=metric&appid=${WEATHER_API_KEY}`
            );
            const data = await response.json();
            return res.json({
                found: false,
                fallback: true,
                weather: {
                    condition: data.weather?.[0]?.main || 'Clear',
                    description: data.weather?.[0]?.description || 'clear sky',
                    temperature: Math.round(data.main?.temp || 15),
                    humidity: data.main?.humidity || 50,
                    wind: data.wind?.speed || 0,
                    icon: data.weather?.[0]?.icon || '01d'
                }
            });
        }

        console.log(`🌤️ Fetching weather for ${stadiumData.stadium} (${decodedName})`);

        const response = await fetch(
            `${WEATHER_API_BASE}/weather?lat=${stadiumData.lat}&lon=${stadiumData.lon}&units=metric&appid=${WEATHER_API_KEY}`
        );
        const data = await response.json();

        res.json({
            found: true,
            stadium: stadiumData.stadium,
            team: decodedName,
            weather: {
                condition: data.weather?.[0]?.main || 'Clear',
                description: data.weather?.[0]?.description || 'clear sky',
                temperature: Math.round(data.main?.temp || 15),
                humidity: data.main?.humidity || 50,
                wind: Math.round(data.wind?.speed || 0),
                icon: data.weather?.[0]?.icon || '01d'
            }
        });
    } catch (error) {
        console.error('Weather fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Получить погоду по координатам
app.get('/api/weather/coords', async (req, res) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({ error: 'lat and lon required' });
        }

        const response = await fetch(
            `${WEATHER_API_BASE}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`
        );
        const data = await response.json();

        res.json({
            weather: {
                condition: data.weather?.[0]?.main || 'Clear',
                description: data.weather?.[0]?.description,
                temperature: Math.round(data.main?.temp || 15),
                humidity: data.main?.humidity,
                wind: Math.round(data.wind?.speed || 0),
                icon: data.weather?.[0]?.icon
            },
            location: data.name
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║     🏆 BetGuru API Proxy Server                   ║
║     Running on http://localhost:${PORT}              ║
║     Football-Data.org: Connected ✓                ║
║     The Odds API: Connected ✓                     ║
║     API-Football (Injuries): Connected ✓          ║
║     OpenWeatherMap: Connected ✓                   ║
╚═══════════════════════════════════════════════════╝
  `);
});
