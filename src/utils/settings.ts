import { promises as fsPromises } from 'fs';
import { join } from 'path';

interface Settings {
    NAME: string;
    PLAYER_DIRECTORY: string;
    MUSIC_DIRECTORY: string;
    PLAYER_PLAYLIST_DIRECTORY: string;
}

// Default installation directory for DecapPlayer
const DEFAULT_PLAYER_DIRECTORY = 'C:\\Decap\\DecapPlayer_V02';

const DEFAULT_SETTINGS: Settings = {
    NAME: "DecapPlayer",
    PLAYER_DIRECTORY: DEFAULT_PLAYER_DIRECTORY,
    MUSIC_DIRECTORY: 'C:\\Decap\\MusicFiles',
    PLAYER_PLAYLIST_DIRECTORY: 'Playlists'
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
            const [key, ...valueParts] = line.split('=').map(part => part.trim());
            const value = valueParts.join('='); // Rejoin in case value contains =
            if (key && value) {
                // Remove quotes if present
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
