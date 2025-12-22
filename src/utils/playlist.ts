import { join, basename } from "path";
import { promises as fsPromises } from "fs";
import { getSettings } from "./settings";

const { access, readFile, writeFile, mkdir, readdir } = fsPromises;

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true; // The file exists
  } catch {
    return false; // The file does not exist
  }
}

export async function createPlaylist(
  playlistName: string,
  songs: string[]
): Promise<void> {
  const settings = await getSettings();
  const targetDirectory = join(settings.PLAYER_PLAYLIST_DIRECTORY);
  const filePath = join(targetDirectory, `${playlistName}.mdl`);

  if (await fileExists(filePath)) {
    throw new Error(`Playlist "${playlistName}" already exists.`);
  }

  const BOM = "\ufeff";
  const content = songs.join("\n");

  await mkdir(targetDirectory, { recursive: true });
  await writeFile(filePath, BOM + content, { encoding: "utf8" });
}

export async function getSongsFromPlaylist(playlistName: string) {
  const settings = await getSettings();
  const targetDirectory = join(settings.PLAYER_PLAYLIST_DIRECTORY);
  const filePath = join(targetDirectory, `${playlistName}.mdl`);

  if (!(await fileExists(filePath))) {
    throw new Error(`Playlist "${playlistName}" does not exist.`);
  }

  const content = await readFile(filePath, { encoding: "utf8" });
  const songPaths = content.split("\n").filter((line) => line.trim() !== "");

  return songPaths.map((fullPath, index) => ({
    index: index + 1, // convert 0-based index to 1-based index
    name: basename(fullPath),
    path: fullPath,
  }));
}

export async function addSongToPlaylist(
  playlistName: string,
  songPath: string
) {
  // console.log("Adding song to playlist");
  const settings = await getSettings();
  const targetDirectory = join(settings.PLAYER_PLAYLIST_DIRECTORY);
  const filePath = join(targetDirectory, `${playlistName}.mdl`);

  // Check if the playlist exists
  if (!(await fileExists(filePath))) {
    throw new Error(`Playlist "${playlistName}" does not exist.`);
  }

  // Check if the song file exists
  if (!(await fileExists(songPath))) {
    throw new Error(`Song file "${songPath}" does not exist.`);
  }

  // Read the current playlist, add the new song, and write back
  let content = await readFile(filePath, { encoding: "utf8" });
  content += `\n${songPath}`;
  await writeFile(filePath, content, { encoding: "utf8" });

  // console.log(`Song added to playlist "${playlistName}" successfully.`);
}

export async function removeSongFromPlaylistByIndex(
  playlistName: string,
  songIndex: number
) {
  const settings = await getSettings();
  const targetDirectory = join(settings.PLAYER_PLAYLIST_DIRECTORY);
  const filePath = join(targetDirectory, `${playlistName}.mdl`);

  // Check if the playlist exists
  if (!(await fileExists(filePath))) {
    throw new Error(`Playlist "${playlistName}" does not exist.`);
  }

  // Read the current playlist
  const content = await readFile(filePath, { encoding: "utf8" });
  const songs = content.split("\n").filter((line) => line.trim() !== "");

  // Validate the song index
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

  // console.log(`Song at index ${songIndex} removed from playlist "${playlistName}" successfully.`);
}

export async function getAllPlaylists() {
  const settings = await getSettings();
  // console.log("Getting all playlists");
  const targetDirectory = join(settings.PLAYER_PLAYLIST_DIRECTORY);

  if (!(await fileExists(targetDirectory))) {
    throw new Error(`Playlist directory does not exist.`);
  }

  const files = await readdir(targetDirectory);
  // Filter to include only .mdl files and map to their full details
  const playlists = files
    .filter((file) => file.endsWith(".mdl"))
    .map((file, index) => {
      const playlistName = file.slice(0, -4); // Remove the extension to get the playlist name
      const fullPath = join(targetDirectory, file);
      return getSongsFromPlaylist(playlistName).then((songs) => ({
        index: index,
        playlistName: playlistName,
        path: fullPath,
        songs: songs,
      }));
    });

  // Wait for all playlist details to be fetched
  return Promise.all(playlists);
}

export async function renamePlaylist(
  oldPlaylistName: string,
  newPlaylistName: string
): Promise<void> {
  const settings = await getSettings();
  const targetDirectory = join(settings.PLAYER_PLAYLIST_DIRECTORY);
  const oldFilePath = join(targetDirectory, `${oldPlaylistName}.mdl`);
  const newFilePath = join(targetDirectory, `${newPlaylistName}.mdl`);

  if (!(await fileExists(oldFilePath))) {
    throw new Error(`Playlist "${oldPlaylistName}" does not exist.`);
  }

  if (await fileExists(newFilePath) && oldPlaylistName !== newPlaylistName) {
    throw new Error(`Playlist "${newPlaylistName}" already exists.`);
  }

  try {
    await fsPromises.rename(oldFilePath, newFilePath);
    // console.log(`Playlist renamed from "${oldPlaylistName}" to "${newPlaylistName}" successfully.`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to rename playlist: ${errorMessage}`);
  }
}

export async function updatePlaylist(
  playlistName: string,
  songs: string[]
): Promise<void> {
  const settings = await getSettings();
  const targetDirectory = join(settings.PLAYER_PLAYLIST_DIRECTORY);
  const filePath = join(targetDirectory, `${playlistName}.mdl`);

  // Check if the playlist exists
  if (!(await fileExists(filePath))) {
    throw new Error(`Playlist "${playlistName}" does not exist.`);
  }

  try {
    // Verify that all songs exist
    // for (const songPath of songs) {
    //   if (!(await fileExists(songPath))) {
    //     throw new Error(`Song file "${songPath}" does not exist.`);
    //   }
    // }

    // Write the updated song list
    const content = songs.join('\n');
    await writeFile(filePath, content, { encoding: "utf8" });

    // console.log(`Playlist "${playlistName}" updated successfully.`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to update playlist "${playlistName}": ${errorMessage}`);
  }
}

export async function deletePlaylist(playlistName: string): Promise<void> {
  const settings = await getSettings();
  const targetDirectory = join(settings.PLAYER_PLAYLIST_DIRECTORY);
  const filePath = join(targetDirectory, `${playlistName}.mdl`);

  if (!(await fileExists(filePath))) {
    throw new Error(`Playlist "${playlistName}" does not exist.`);
  }

  try {
    await fsPromises.unlink(filePath);
    // console.log(`Playlist "${playlistName}" deleted successfully.`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to delete playlist "${playlistName}": ${errorMessage}`);
  }
}