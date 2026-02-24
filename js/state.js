import { PERSONA } from './config.js';

let conversationHistory = [];
let currentUsername = 'guest';

// --- pembantu persistensi ---
function historyKeyFor(user) {
    return `worm_v2_history::${user || 'guest'}`;
}

export function setUsername(username) {
    currentUsername = username || 'guest';
}

export function getUsername() {
    return currentUsername;
}

export function getHistory() {
    return conversationHistory;
}

export function addToHistory(role, text) {
    conversationHistory.push({
        role: role,
        parts: [{ text: text }]
    });
    saveHistory();
}

export function resetHistory() {
    conversationHistory = [
        { role: 'user', parts: [{ text: PERSONA }] },
        { role: 'model', parts: [{ text: "Hallo bro, welcome to Tools V1.5 WORM GPT. Apakah ada yang bisa saya bantu?" }] }
    ];
    saveHistory();
    return conversationHistory;
}

export function saveHistory() {
    try {
        const key = historyKeyFor(currentUsername);
        localStorage.setItem(key, JSON.stringify(conversationHistory));
    } catch (e) { console.warn('Failed saving history', e); }
}

export function loadHistory() {
    try {
        const key = historyKeyFor(currentUsername);
        const raw = localStorage.getItem(key);
        if (!raw) return false;
        const hist = JSON.parse(raw);
        if (!Array.isArray(hist)) return false;
        // migrate stored history: replace any legacy 'v1.3' (or 'v.1.3') with 'V1.5'
        try {
            const re = /v\.?1\.3/ig;
            hist.forEach(msg => {
                if (!msg || !Array.isArray(msg.parts)) return;
                msg.parts.forEach(part => {
                    if (part && typeof part.text === 'string') {
                        part.text = part.text.replace(re, 'V1.5');
                    }
                });
            });
        } catch (e) {
            // ignore migration errors, proceed with original data
        }

        conversationHistory = hist;
        return true;
    } catch (e) {
        console.warn('Failed loading history', e);
        return false;
    }
}

export function isPersonaMessage(text) {
    if (!text) return false;
    try {
        const a = text.trim();
        const b = PERSONA.trim();
        if (a === b) return true;
        if (a.indexOf('Lo adalah WormGPT') !== -1) return true;
        return false;
    } catch (e) { return false; }
}
