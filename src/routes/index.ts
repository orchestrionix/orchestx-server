import { Router } from "express";
import {
  TCPLoadPlaylistRemotePlayer,
  TCPNextRemotePlayer,
  TCPPlayItemRemotePlayer,
  TCPPrevRemotePlayer,
  TCPRemotePlayerActivePlaylist,
  TCPRemotePlayerState,
  TCPSelectItemRemotePlayer,
  TCPToggleRemotePlayer,
  TCPSetVolumeRemotePlayer,
  TCPSetViewModeRemotePlayer,
} from "../utils/state_and_controles";
import {
  addSongToPlaylist,
  createPlaylist,
  fileExists,
  getAllPlaylists,
  getSongsFromPlaylist,
  removeSongFromPlaylistByIndex,
  updatePlaylist,
  deletePlaylist,
  renamePlaylist,
} from "../utils/playlist";
import {
  getAllPresetPlaylists,
  getSongsFromPresetPlaylist,
  addSongToPresetPlaylist,
  removeSongFromPresetPlaylistByIndex,
  updatePresetPlaylist,
  getPresetIndexFromName,
  isPresetPlaylistName,
} from "../utils/presetPlaylist";
import directoryTree from "directory-tree";
import WebSocket from 'ws';
import { Server } from 'http';
import { getSettings, updateSettings } from "../utils/settings";
import { hostname } from 'os';

const router = Router();

// ==========================================================
// ========= S T A T E   A N D   C O N T R O L E S ==========
// ==========================================================

router.get("/get-remote-player-state", async (req, res) => {
  try {
    const state = await TCPRemotePlayerState();

    res.json(state);
  } catch (error: any) {
    res.status(500).json({ error: error?.message });
  }
});

router.get("/get-remote-player-active-playlist", async (req, res) => {
  console.log("Route handler triggered: GET /get-remote-player-active-playlist");
  try {
    // console.log("Getting remote player active playlist");
    const playlist = await TCPRemotePlayerActivePlaylist();
   
    res.json(playlist);
  } catch (error: any) {
    console.error("Error getting remote player active playlist:", error);
    res.status(500).json({ error: error?.message });
  }
});

router.get("/toggle-remote-player", async (req, res) => {
  try {
    const result = await TCPToggleRemotePlayer();
    res.json({ success: result });
  } catch (error: any) {
    res.status(500).json({ error: error?.message });
  }
});

router.get("/next-remote-player", async (req, res) => {
  try {
    const result = await TCPNextRemotePlayer();
    res.json({ success: result });
  } catch (error: any) {
    res.status(500).json({ error: error?.message });
  }
});

router.get("/prev-remote-player", async (req, res) => {
  try {
    const result = await TCPPrevRemotePlayer();
    res.json({ success: result });
  } catch (error: any) {
    res.status(500).json({ error: error?.message });
  }
});

router.post("/play-item-remote-player", async (req, res) => {
  const { songIndex } = req.body;

  // console.log("Playing item remote player:", songIndex);

  if (!songIndex && songIndex !== 0) {
    return res.status(400).json({ error: "Song index is required" });
  }

  try {
    await TCPPlayItemRemotePlayer(songIndex);
    res.sendStatus(200);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/select-item-remote-player", async (req, res) => {
  const { songIndex } = req.body;

  if (!songIndex && songIndex !== 0) {
    return res.status(400).json({ error: "Song index is required" });
  }

  try {
    await TCPSelectItemRemotePlayer(songIndex);
    res.sendStatus(200);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/load-playlist-remote-player", async (req, res) => {
  const { path, playIndex } = req.body;

  if (!path) {
    return res.status(400).json({ error: "Path is required" }); 
  }

  try {
    // console.log("Loading playlist:", path);
    // console.log("Playing index:", playIndex);

    const state = await TCPRemotePlayerState();

    if (state.status === "playing") {
      await TCPToggleRemotePlayer();
    }
    
    // load the new playlist
    await TCPLoadPlaylistRemotePlayer(path);

    // fetch the playlist, and the order of wich the suffled playlist is
    const playlist = await TCPRemotePlayerActivePlaylist();
    const order = playlist.order;

    // play the item at the index of the order
    await TCPPlayItemRemotePlayer(order[playIndex]?.toString() || "0");

    res.sendStatus(200);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/set-volume-remote-player", async (req, res) => {
  const { volume } = req.body;

  if (volume === undefined) {
    return res.status(400).json({ error: "Volume value is required" });
  }

  try {
    // console.log("Setting volume:", volume);
    const result = await TCPSetVolumeRemotePlayer(Number(volume));
    res.json({ success: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/set-view-mode-remote-player", async (req, res) => {
  const { viewMode } = req.body;

  if (viewMode === undefined) {
    return res.status(400).json({ error: "View mode value is required" });
  }

  try {
    const result = await TCPSetViewModeRemotePlayer(Number(viewMode));
    res.json({ success: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================================
// ================== P L A Y L I S T S  ====================
// ==========================================================

router.post("/file-exists", async (req, res) => {
  // Changed to POST
  const { path: filePath } = req.body;

  if (!filePath) {
    return res.status(400).json({ error: "No file path provided" });
  }

  try {
    const exists = await fileExists(filePath);
    res.json({ exists });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/create-playlist", async (req, res) => {
  const { playlistName, songs } = req.body;

  if (!playlistName || !songs) {
    return res
      .status(400)
      .json({ error: "Playlist name and songs are required" });
  }

  try {
    const result = await createPlaylist(playlistName, songs);
    res.status(201).json({ message: "Playlist created successfully", result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/get-songs-from-playlist", async (req, res) => {
  const { playlistName } = req.body;

  if (!playlistName) {
    return res.status(400).json({ error: "Playlist name is required" });
  }

  try {
    const songs = await getSongsFromPlaylist(playlistName);

    res.json({ songs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/add-songs-to-playlist", async (req, res) => {
  const { playlistName, songPath } = req.body;

  if (!playlistName) {
    return res.status(400).json({ error: "Playlist name is required" });
  }

  if (!songPath) {
    return res.status(400).json({ error: "Song path is required" });
  }

  try {
    await addSongToPlaylist(playlistName, songPath);
    res.sendStatus(200);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/delete-song-from-playlist-by-index", async (req, res) => {
  const { playlistName, songIndex } = req.body;

  if (!playlistName) {
    return res.status(400).json({ error: "Playlist name is required" });
  }

  if (!songIndex) {
    return res.status(400).json({ error: "Song index is required" });
  }

  try {
    await removeSongFromPlaylistByIndex(playlistName, songIndex);
    res.sendStatus(200);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/rename-playlist", async (req, res) => {
  const { oldPlaylistName, newPlaylistName } = req.body;

  if (!oldPlaylistName || !newPlaylistName) {
    return res.status(400).json({ 
      error: "Both old and new playlist names are required" 
    });
  }

  try {
    await renamePlaylist(oldPlaylistName, newPlaylistName);
    res.json({ message: "Playlist updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/delete-playlist", async (req, res) => {
  const { playlistName } = req.body;

  if (!playlistName) {
    return res.status(400).json({ error: "Playlist name is required" });
  }

  try {
    await deletePlaylist(playlistName);
    res.json({ message: "Playlist deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/update-playlist", async (req, res) => {
  const { playlistName, songs } = req.body;

  if (!playlistName || !songs) {
    return res.status(400).json({ 
      error: "Playlist name and songs array are required" 
    });
  }

  try {
    await updatePlaylist(playlistName, songs);
    res.json({ message: "Playlist updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================================
// ============ P R E S E T   P L A Y L I S T S =============
// ==========================================================

router.get("/get-all-preset-playlists", async (req, res) => {
  try {
    const presets = await getAllPresetPlaylists();
    res.json({ playlists: presets });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/get-songs-from-preset-playlist", async (req, res) => {
  const { presetIndex } = req.body;

  if (presetIndex === undefined || presetIndex === null) {
    return res.status(400).json({ error: "Preset index is required" });
  }

  try {
    const songs = await getSongsFromPresetPlaylist(presetIndex);
    res.json({ songs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/add-song-to-preset-playlist", async (req, res) => {
  const { presetIndex, songPath } = req.body;

  if (presetIndex === undefined || presetIndex === null) {
    return res.status(400).json({ error: "Preset index is required" });
  }

  if (!songPath) {
    return res.status(400).json({ error: "Song path is required" });
  }

  try {
    await addSongToPresetPlaylist(presetIndex, songPath);
    res.sendStatus(200);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/delete-song-from-preset-playlist-by-index", async (req, res) => {
  const { presetIndex, songIndex } = req.body;

  if (presetIndex === undefined || presetIndex === null) {
    return res.status(400).json({ error: "Preset index is required" });
  }

  if (!songIndex) {
    return res.status(400).json({ error: "Song index is required" });
  }

  try {
    await removeSongFromPresetPlaylistByIndex(presetIndex, songIndex);
    res.sendStatus(200);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/update-preset-playlist", async (req, res) => {
  const { presetIndex, songs } = req.body;

  if (presetIndex === undefined || presetIndex === null) {
    return res.status(400).json({ error: "Preset index is required" });
  }

  if (!songs) {
    return res.status(400).json({ 
      error: "Songs array is required" 
    });
  }

  try {
    await updatePresetPlaylist(presetIndex, songs);
    res.json({ message: "Preset playlist updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================================
// =================== D I R E C T O R Y ====================
// ==========================================================

router.get("/get-file-directory", async (req, res) => {
  try {
    const settings = await getSettings();
    const tree = directoryTree(settings.MUSIC_DIRECTORY, {
      attributes: ["size", "type", "extension"],
    });

    res.json(tree);
  } catch (error: any) {
    res.status(500).json({ error: error?.message });
  }
});

router.get("/get-all-playlists", async (req, res) => {
  try {
    // Get regular playlists and add isPreset: false
    const regularPlaylists = await getAllPlaylists();
    const regularWithFlag = regularPlaylists.map(p => ({
      ...p,
      isPreset: false,
      displayName: p.playlistName,
    }));

    // Get preset playlists (already have isPreset: true)
    const presetPlaylists = await getAllPresetPlaylists();

    // Combine: presets first, then regular playlists
    const allPlaylists = [...presetPlaylists, ...regularWithFlag];
    
    res.json({ playlists: allPlaylists });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================================
// ===================== S E T T I N G S ====================
// ==========================================================

/**
 * GET /api/settings
 * Retrieves all current settings from the settings.ini file
 * 
 * Response:
 * {
 *   NAME: string            - Name of the player instance
 *   PLAYER_DIRECTORY: string - Path to DecapPlayer installation
 *   MUSIC_DIRECTORY: string  - Path to music files directory
 *   PLAYER_PLAYLIST_DIRECTORY: string - Name of playlist directory
 * }
 */
router.get('/settings', async (req, res) => {
  try {
      const settings = await getSettings();
      res.json(settings);
  } catch (error: any) {
      res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/settings/:key
 * Updates a single setting value in settings.ini
 * 
 * URL Parameters:
 * - key: The setting name to update (NAME, PLAYER_DIRECTORY, etc.)
 * 
 * Request Body:
 * {
 *   value: string - The new value for the setting
 * }
 * 
 * Response:
 * {
 *   message: string - Success message
 *   settings: object - Updated settings object
 * }
 * 
 * Example:
 * PATCH /api/settings/NAME
 * { "value": "MyPlayer" }
 */
router.patch('/settings/:key', async (req, res) => {
  try {
      const { key } = req.params;
      const { value } = req.body;

      if (!value) {
          return res.status(400).json({ error: "Value is required" });
      }

      await updateSettings({ [key]: value });
      const updatedSettings = await getSettings();
      
      res.json({
          message: `Setting "${key}" updated successfully`,
          settings: updatedSettings
      });
  } catch (error: any) {
      res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/settings
 * Updates multiple settings at once in settings.ini
 * 
 * Request Body:
 * Partial<Settings> object containing one or more settings to update
 * {
 *   NAME?: string
 *   PLAYER_DIRECTORY?: string
 *   MUSIC_DIRECTORY?: string
 *   PLAYER_PLAYLIST_DIRECTORY?: string
 * }
 * 
 * Response:
 * {
 *   message: string - Success message
 *   settings: object - Complete updated settings object
 * }
 * 
 * Example:
 * {
 *   "NAME": "MyPlayer",
 *   "MUSIC_DIRECTORY": "D:\Music"
 * }
 */
router.put('/settings', async (req, res) => {
  try {
      const newSettings = req.body;
      
      if (!Object.keys(newSettings).length) {
          return res.status(400).json({ error: "No settings provided" });
      }

      await updateSettings(newSettings);
      const updatedSettings = await getSettings();
      
      res.json({
          message: "Settings updated successfully",
          settings: updatedSettings
      });
  } catch (error: any) {
      res.status(500).json({ error: error.message });
  }
});

// ==========================================================
// =================== H O S T N A M E ======================
// ==========================================================

router.get("/hostname", (req, res) => {
  try {
    const machineHostname = hostname();
    res.json({ hostname: machineHostname });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================================
// =================== W E B S O C K E T ====================
// ==========================================================

let wss: WebSocket.Server;

export function initializeWebSocket(server: Server) {
  wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws) => {
    // console.log('New WebSocket connection');
    
    // Add connection count logging
    // console.log(`Active connections: ${wss.clients.size}`);
    
    // Poll player state every 500ms (was 100ms)
    // Client-side interpolation handles smooth progress bar animation at 60fps
    // Server just provides periodic sync points
    const intervalId = setInterval(async () => {
      try {
        const state = await TCPRemotePlayerState();
        ws.send(JSON.stringify(state));
      } catch (error) {
        console.error('Error sending player state:', error);
      }
    }, 500);

    ws.on('close', () => {
      clearInterval(intervalId);
      // console.log('Client disconnected');
    });
  });
}


export default router;
