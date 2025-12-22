import { join, basename } from "path";
import { promises as fsPromises } from "fs";
import { getSettings } from "./settings";
import { fileExists } from "./playlist";

const { access, readFile, writeFile, mkdir, readdir } = fsPromises;

// Preset playlist configuration
export const PRESET_FOLDER_NAME = "Preset";
export const PRESET_COUNT = 10; // PresetPlaylist0.mdl through PresetPlaylist9.mdl

/**
 * Get the preset playlists directory path
 */
export async function getPresetDirectory(): Promise<string> {
  const settings = await getSettings();
  return join(settings.PLAYER_PLAYLIST_DIRECTORY, PRESET_FOLDER_NAME);
}

/**
 * Get the display name for a preset playlist
 * e.g., "Preset 1" for PresetPlaylist0.mdl
 */
export function getPresetDisplayName(index: number): string {
  return `Preset ${index + 1}`;
}

/**
 * Check if a playlist name is a preset playlist
 */
export function isPresetPlaylistName(playlistName: string): boolean {
  const match = playlistName.match(/^PresetPlaylist(\d+)$/);
  if (!match) return false;
  const index = parseInt(match[1], 10);
  return index >= 0 && index < PRESET_COUNT;
}

/**
 * Ensure the presets directory exists and all preset files are created
 */
export async function ensurePresetPlaylistsExist(): Promise<void> {
  const presetDir = await getPresetDirectory();
  
  // Create the Presets directory if it doesn't exist
  await mkdir(presetDir, { recursive: true });
  
  // Create each preset file if it doesn't exist
  for (let i = 0; i < PRESET_COUNT; i++) {
    const filePath = join(presetDir, `PresetPlaylist${i}.mdl`);
    if (!(await fileExists(filePath))) {
      const BOM = "\ufeff";
      await writeFile(filePath, BOM, { encoding: "utf8" });
    }
  }
}

/**
 * Get songs from a specific preset playlist
 */
export async function getSongsFromPresetPlaylist(presetIndex: number) {
  if (presetIndex < 0 || presetIndex >= PRESET_COUNT) {
    throw new Error(`Invalid preset index: ${presetIndex}. Must be between 0 and ${PRESET_COUNT - 1}.`);
  }

  await ensurePresetPlaylistsExist();
  
  const presetDir = await getPresetDirectory();
  const filePath = join(presetDir, `PresetPlaylist${presetIndex}.mdl`);

  const content = await readFile(filePath, { encoding: "utf8" });
  const songPaths = content.split("\n").filter((line) => line.trim() !== "" && line !== "\ufeff");

  return songPaths.map((fullPath, index) => ({
    index: index + 1,
    name: basename(fullPath),
    path: fullPath,
  }));
}

/**
 * Add a song to a preset playlist
 */
export async function addSongToPresetPlaylist(
  presetIndex: number,
  songPath: string
) {
  if (presetIndex < 0 || presetIndex >= PRESET_COUNT) {
    throw new Error(`Invalid preset index: ${presetIndex}. Must be between 0 and ${PRESET_COUNT - 1}.`);
  }

  await ensurePresetPlaylistsExist();

  // Check if the song file exists
  if (!(await fileExists(songPath))) {
    throw new Error(`Song file "${songPath}" does not exist.`);
  }

  const presetDir = await getPresetDirectory();
  const filePath = join(presetDir, `PresetPlaylist${presetIndex}.mdl`);

  // Read the current playlist, add the new song, and write back
  let content = await readFile(filePath, { encoding: "utf8" });
  
  // Handle BOM and empty content
  const cleanContent = content.replace(/^\ufeff/, "").trim();
  if (cleanContent) {
    content = cleanContent + `\n${songPath}`;
  } else {
    content = songPath;
  }
  
  await writeFile(filePath, content, { encoding: "utf8" });

  // console.log(`Song added to preset playlist ${presetIndex} successfully.`);
}

/**
 * Remove a song from a preset playlist by index
 */
export async function removeSongFromPresetPlaylistByIndex(
  presetIndex: number,
  songIndex: number
) {
  if (presetIndex < 0 || presetIndex >= PRESET_COUNT) {
    throw new Error(`Invalid preset index: ${presetIndex}. Must be between 0 and ${PRESET_COUNT - 1}.`);
  }

  await ensurePresetPlaylistsExist();

  const presetDir = await getPresetDirectory();
  const filePath = join(presetDir, `PresetPlaylist${presetIndex}.mdl`);

  // Read the current playlist
  const content = await readFile(filePath, { encoding: "utf8" });
  const songs = content.split("\n").filter((line) => line.trim() !== "" && line !== "\ufeff");

  // Validate the song index (1-based)
  if (songIndex < 1 || songIndex > songs.length) {
    throw new Error(
      `Invalid song index: ${songIndex}. Playlist contains ${songs.length} songs.`
    );
  }

  // Remove the song by index (adjust for 0-based array indexing)
  const updatedSongs = songs
    .filter((_, index) => index !== songIndex - 1)
    .join("\n");
  await writeFile(filePath, updatedSongs, { encoding: "utf8" });

  // console.log(`Song at index ${songIndex} removed from preset playlist ${presetIndex} successfully.`);
}

/**
 * Update the songs in a preset playlist (for reordering)
 */
export async function updatePresetPlaylist(
  presetIndex: number,
  songs: string[]
): Promise<void> {
  if (presetIndex < 0 || presetIndex >= PRESET_COUNT) {
    throw new Error(`Invalid preset index: ${presetIndex}. Must be between 0 and ${PRESET_COUNT - 1}.`);
  }

  await ensurePresetPlaylistsExist();

  const presetDir = await getPresetDirectory();
  const filePath = join(presetDir, `PresetPlaylist${presetIndex}.mdl`);

  try {
    const content = songs.join('\n');
    await writeFile(filePath, content, { encoding: "utf8" });
    // console.log(`Preset playlist ${presetIndex} updated successfully.`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to update preset playlist ${presetIndex}: ${errorMessage}`);
  }
}

/**
 * Get all preset playlists
 */
export async function getAllPresetPlaylists() {
  await ensurePresetPlaylistsExist();

  const presetDir = await getPresetDirectory();
  const presets = [];

  for (let i = 0; i < PRESET_COUNT; i++) {
    const playlistName = `PresetPlaylist${i}`;
    const fullPath = join(presetDir, `${playlistName}.mdl`);
    const songs = await getSongsFromPresetPlaylist(i);

    presets.push({
      index: i,
      playlistName: playlistName,
      displayName: getPresetDisplayName(i),
      path: fullPath,
      songs: songs,
      isPreset: true,
    });
  }

  return presets;
}

/**
 * Get preset index from playlist name
 * Returns -1 if not a preset playlist
 */
export function getPresetIndexFromName(playlistName: string): number {
  const match = playlistName.match(/^PresetPlaylist(\d+)$/);
  if (!match) return -1;
  const index = parseInt(match[1], 10);
  if (index < 0 || index >= PRESET_COUNT) return -1;
  return index;
}

