import AsyncStorage from '@react-native-async-storage/async-storage';

export type LeagueName = 'Bronce' | 'Plata' | 'Oro' | 'Zafiro' | 'Rubi' | 'Esmeralda' | 'Diamante';

interface LeagueConfig {
  name: LeagueName;
  promote: number;
  demote: number;
  minXP: number;
}

const LEAGUES: LeagueConfig[] = [
  { name: 'Bronce', promote: 5, demote: 0, minXP: 0 },
  { name: 'Plata', promote: 4, demote: 3, minXP: 500 },
  { name: 'Oro', promote: 3, demote: 3, minXP: 1500 },
  { name: 'Zafiro', promote: 3, demote: 3, minXP: 3000 },
  { name: 'Rubi', promote: 2, demote: 3, minXP: 5000 },
  { name: 'Esmeralda', promote: 2, demote: 2, minXP: 8000 },
  { name: 'Diamante', promote: 1, demote: 2, minXP: 12000 },
];

interface BotProfile {
  name: string;
  baseXP: number;
  volatility: number;
}

const BOTS: BotProfile[] = [
  { name: 'Sara L.', baseXP: 200, volatility: 0.3 },
  { name: 'Pedro M.', baseXP: 350, volatility: 0.5 },
  { name: 'Maria G.', baseXP: 150, volatility: 0.2 },
  { name: 'Juan P.', baseXP: 400, volatility: 0.4 },
  { name: 'Ana R.', baseXP: 250, volatility: 0.35 },
  { name: 'Lucas V.', baseXP: 300, volatility: 0.45 },
  { name: 'Ruth C.', baseXP: 180, volatility: 0.25 },
  { name: 'David S.', baseXP: 500, volatility: 0.6 },
  { name: 'Ester T.', baseXP: 220, volatility: 0.3 },
  { name: 'Samuel H.', baseXP: 280, volatility: 0.4 },
];

export interface LeagueEntry {
  name: string;
  xp: number;
  isBot: boolean;
  isPlayer?: boolean;
}

export interface LeagueState {
  league: LeagueName;
  weekStart: string;
  entries: LeagueEntry[];
  playerRank: number;
}

const LEAGUE_KEY = 'verbo_league';

export function getLeagueByXP(xp: number): LeagueName {
  let league: LeagueName = 'Bronce';
  for (const l of LEAGUES) {
    if (xp >= l.minXP) league = l.name;
  }
  return league;
}

export function generateBotScores(league: LeagueName, playerXP: number, dayOfWeek: number): LeagueEntry[] {
  const leagueConfig = LEAGUES.find(l => l.name === league) || LEAGUES[0];
  const entries: LeagueEntry[] = [];

  for (const bot of BOTS) {
    const progressFactor = Math.min(dayOfWeek / 7, 1);
    const noise = (Math.random() - 0.5) * 2 * bot.volatility;
    const botXP = Math.round(bot.baseXP * (0.3 + 0.7 * progressFactor) * (1 + noise));
    entries.push({ name: bot.name, xp: botXP, isBot: true });
  }

  entries.push({ name: 'Tu', xp: playerXP, isBot: false, isPlayer: true });
  entries.sort((a, b) => b.xp - a.xp);

  return entries;
}

export async function loadLeagueState(playerXP: number): Promise<LeagueState> {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const weekStart = monday.toISOString().split('T')[0];

  try {
    const raw = await AsyncStorage.getItem(LEAGUE_KEY);
    if (raw) {
      const saved: LeagueState = JSON.parse(raw);
      if (saved.weekStart === weekStart) {
        return saved;
      }
    }
  } catch {}

  const league = getLeagueByXP(playerXP);
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const entries = generateBotScores(league, playerXP, daysSinceMonday);
  const playerIndex = entries.findIndex(e => e.isPlayer);
  const newState: LeagueState = { league, weekStart, entries, playerRank: playerIndex >= 0 ? playerIndex + 1 : entries.length };
  await AsyncStorage.setItem(LEAGUE_KEY, JSON.stringify(newState));
  return newState;
}

export async function refreshLeagueState(playerXP: number): Promise<LeagueState> {
  const state = await loadLeagueState(playerXP);
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7;

  const playerEntry = state.entries.find(e => e.isPlayer);
  if (playerEntry) playerEntry.xp = playerXP;

  for (const entry of state.entries) {
    if (entry.isBot) {
      const bot = BOTS.find(b => b.name === entry.name);
      if (bot) {
        const progressFactor = Math.min(dayOfWeek / 7, 1);
        const noise = (Math.random() - 0.5) * 2 * bot.volatility * 0.3;
        entry.xp = Math.round(bot.baseXP * (0.3 + 0.7 * progressFactor) * (1 + noise));
      }
    }
  }

  state.entries.sort((a, b) => b.xp - a.xp);
  const playerIndex = state.entries.findIndex(e => e.isPlayer);
  state.playerRank = playerIndex >= 0 ? playerIndex + 1 : state.entries.length;

  await AsyncStorage.setItem(LEAGUE_KEY, JSON.stringify(state));
  return state;
}

export function getPromoteDemoteInfo(league: LeagueName): { promote: number; demote: number } {
  const config = LEAGUES.find(l => l.name === league) || LEAGUES[0];
  return { promote: config.promote, demote: config.demote };
}

export function getNextLeagueName(league: LeagueName): LeagueName | null {
  const idx = LEAGUES.findIndex(l => l.name === league);
  if (idx < LEAGUES.length - 1) return LEAGUES[idx + 1].name;
  return null;
}

export function getPrevLeagueName(league: LeagueName): LeagueName | null {
  const idx = LEAGUES.findIndex(l => l.name === league);
  if (idx > 0) return LEAGUES[idx - 1].name;
  return null;
}
