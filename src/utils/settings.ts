import { promises as fsPromises } from 'fs';
import { join } from 'path';

interface Settings {
    NAME: string;
    /** Enable presence client and central hub logo link (true/false) */
    ENABLE_PRESENCE?: string;
    PLAYER_DIRECTORY: string;
    MUSIC_DIRECTORY: string;
    PLAYER_PLAYLIST_DIRECTORY: string;
    /** Presence service WebSocket URL (optional) */
    PRESENCE_WS_URL?: string;
    /** Instrument ID for presence (optional, derived from hostname if empty) */
    INSTRUMENT_ID?: string;
    /** Display name for presence (optional, uses INSTRUMENT_ID if empty) */
    INSTRUMENT_NAME?: string;
    /** Local URL where React app is reachable (optional, auto-detected if empty) */
    LOCAL_REACT_URL?: string;
    /** Server port for auto-detected local URL (optional, default 4000) */
    PORT?: string;
}

// Default installation directory for DecapPlayer
const DEFAULT_PLAYER_DIRECTORY = 'C:\\Decap\\DecapPlayer_V02';

const DEFAULT_SETTINGS: Settings = {
    NAME: "DecapPlayer",
    ENABLE_PRESENCE: "false",
    PLAYER_DIRECTORY: DEFAULT_PLAYER_DIRECTORY,
    MUSIC_DIRECTORY: 'C:\\Decap\\MusicFiles',
    PLAYER_PLAYLIST_DIRECTORY: 'Playlists',
    PRESENCE_WS_URL: 'wss://orchestx-reddis-production.up.railway.app/ws',
    PORT: '4000',
};

// The settings file will be in the same directory as the application
const SETTINGS_FILE = join(process.cwd(), 'settings.ini');

/**
 * Reads the settings from the INI file
 */
async function readSettings(): Promise<Settings> {
    try {
        const content = await fsPromises.readFile(SETTINGS_FILE, 'utf8');
        const settings: Partial<Settings> = {};
        
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const [key, ...valueParts] = trimmed.split('=').map(part => part.trim());
            const value = valueParts.join('=').trim(); // Rejoin in case value contains =
            if (key && value) {
                const cleanValue = value.replace(/^"(.*)"$/, '$1');
                settings[key as keyof Settings] = cleanValue;
            }
        });
        
        // Merge with default settings to ensure all required fields exist
        return { ...DEFAULT_SETTINGS, ...settings };
    } catch (error) {
        // If file doesn't exist, return default settings
        return DEFAULT_SETTINGS;
    }
}

/**
 * Writes settings to the INI file
 */
async function writeSettings(settings: Settings): Promise<void> {
    const content = Object.entries(settings)
        .map(([key, value]) => `${key}="${value}"`)
        .join('\n');

    await fsPromises.writeFile(SETTINGS_FILE, content, 'utf8');
}

/**
 * Updates specific settings while preserving others
 */
export async function updateSettings(newSettings: Partial<Settings>): Promise<void> {
    try {
        // Read existing settings
        const currentSettings = await readSettings();
        
        // Merge with new settings
        const updatedSettings = {
            ...currentSettings,
            ...newSettings
        };

        // Write back to file
        await writeSettings(updatedSettings);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to update settings: ${errorMessage}`);
    }
}

/**
 * Gets the current settings
 */
export async function getSettings(): Promise<Settings> {
    try {
        return await readSettings();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to read settings: ${errorMessage}`);
    }
}
