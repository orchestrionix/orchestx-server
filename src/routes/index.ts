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
import directoryTree from "directory-tree";
import { MUSIC_DIRECTORY } from "../utils/constants";
import WebSocket from 'ws';
import { Server } from 'http';

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
  try {
    const playlist = await TCPRemotePlayerActivePlaylist();

    res.json(playlist);
  } catch (error: any) {
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

  if (!songIndex) {
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

  if (!songIndex) {
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
    console.log("Loading playlist:", path);
    console.log("Playing index:", playIndex);
    
    await TCPLoadPlaylistRemotePlayer(path);
    await TCPPlayItemRemotePlayer(playIndex?.toString() || "0");
    
    res.sendStatus(200);
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
// =================== D I R E C T O R Y ====================
// ==========================================================

router.get("/get-file-directory", async (req, res) => {
  try {
    const tree = directoryTree(MUSIC_DIRECTORY, {
      attributes: ["size", "type", "extension"],
    });


    res.json(tree);
  } catch (error: any) {
    res.status(500).json({ error: error?.message });
  }
});

router.get("/get-all-playlists", async (req, res) => {
  try {
    const playlists = await getAllPlaylists();

    
    
    res.json({ playlists });
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
    console.log('New WebSocket connection');
    
    // Add connection count logging
    console.log(`Active connections: ${wss.clients.size}`);
    
    const intervalId = setInterval(async () => {
      try {
        const state = await TCPRemotePlayerState();

        ws.send(JSON.stringify(state));
      } catch (error) {
        console.error('Error sending player state:', error);
      }
    }, 100);

    ws.on('close', () => {
      clearInterval(intervalId);
      console.log('Client disconnected');
    });
  });
}

export default router;
