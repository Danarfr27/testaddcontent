import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'api_data');
const FILE = path.join(DATA_DIR, 'device_map.json');

function ensureDir() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}

export function readMap() {
  try {
    ensureDir();
    if (!fs.existsSync(FILE)) return {};
    const raw = fs.readFileSync(FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

export function writeMap(map) {
  try {
    ensureDir();
    fs.writeFileSync(FILE, JSON.stringify(map, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

export function setDeviceForUser(username, deviceId) {
  const m = readMap();
  m[username] = deviceId;
  return writeMap(m);
}

export function getDeviceForUser(username) {
  const m = readMap();
  return m[username] || null;
}

export function clearDeviceForUser(username) {
  const m = readMap();
  if (m[username]) {
    delete m[username];
    return writeMap(m);
  }
  return true;
}
