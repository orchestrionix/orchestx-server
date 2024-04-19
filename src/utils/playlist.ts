import { PLAYER_PLAYLIST_DIRECTORY } from "./constants";
import { join, basename } from 'path';
import { promises as fsPromises } from 'fs';

const { access, readFile, writeFile, mkdir, readdir } = fsPromises;

// Helper function to check if a file exists
export async function fileExists(filePath: string): Promise<boolean> {
    try {
        await access(filePath);
        return true; // The file exists
    } catch {
        return false; // The file does not exist
    }
}


// Function to create a new playlist
export async function createPlaylist(playlistName: string, songs: string[]): Promise<void> {
    const targetDirectory = PLAYER_PLAYLIST_DIRECTORY;
    const filePath = join(targetDirectory, `${playlistName}.mdl`);

    if (await fileExists(filePath)) {
        throw new Error(`Playlist "${playlistName}" already exists.`);
    }

    const BOM = "\ufeff";
    const content = songs.join("\n");

    await mkdir(targetDirectory, { recursive: true });
    await writeFile(filePath, BOM + content, { encoding: "utf8" });
}

// API to get songs from a specific playlist
// Function to get songs from a playlist
export async function getSongsFromPlaylist(playlistName: string) {
    const targetDirectory = PLAYER_PLAYLIST_DIRECTORY;
    const filePath = join(targetDirectory, `${playlistName}.mdl`);

    if (!(await fileExists(filePath))) {
        throw new Error(`Playlist "${playlistName}" does not exist.`);
    }

    const content = await readFile(filePath, { encoding: "utf8" });
    const songPaths = content.split("\n").filter((line) => line.trim() !== "");

    return songPaths.map((fullPath, index) => ({
        index: index + 1,  // convert 0-based index to 1-based index
        name: basename(fullPath),
        path: fullPath
    }));
}