import { Router } from 'express';
import { TCPNextRemotePlayer, TCPPrevRemotePlayer, TCPRemotePlayerState, TCPToggleRemotePlayer } from '../utils/state_and_controles';
import { createPlaylist, fileExists, getSongsFromPlaylist } from '../utils/playlist';
import directoryTree from 'directory-tree';
import { MUSIC_DIRECTORY } from '../utils/constants';

const router = Router();

// ==========================================================
// ========= S T A T E   A N D   C O N T R O L E S ==========
// ==========================================================

router.get('/get-remote-player-state', async (req, res) => {
    try {
        const state = await TCPRemotePlayerState();
        res.json(state);
    } catch (error: any) {
        res.status(500).json({ error: error?.message });
    }
});

router.get('/toggle-remote-player', async (req, res) => {
    try {
        const result = await TCPToggleRemotePlayer();
        res.json({ success: result });
    } catch (error: any) {
        res.status(500).json({ error: error?.message });
    }
});

router.get('/next-remote-player', async (req, res) => {
    try {
        const result = await TCPNextRemotePlayer();
        res.json({ success: result });
    } catch (error: any) {
        res.status(500).json({ error: error?.message });
    }
});

router.get('/prev-remote-player', async (req, res) => {
    try {
        const result = await TCPPrevRemotePlayer();
        res.json({ success: result });
    } catch (error: any) {
        res.status(500).json({ error: error?.message });
    }
});

// ==========================================================
// ================== P L A Y L I S T S  ====================
// ==========================================================

router.get('/file-exists', async (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) {
        return res.status(400).json({ error: "No file path provided" });
    }
    const exists = await fileExists(filePath);
    res.json({ exists });
});


router.get('/get-songs-from-playlist', async (req, res) => {
    const playlistName: string = req.query.playlistName as string;

    if (!playlistName) {
        return res.status(400).json({ error: "Playlist name is required" });
    }

    try {
        const songs = await getSongsFromPlaylist(playlistName);
        res.json({ songs });
    } catch (error: any) {
        res.status(500).json({ error: error?.message });
    }
});

router.post('/create-playlist', async (req, res) => {
    const playlistName: string = req.body.playlistName;
    const songs: string[] = req.body.songs;

    if (!playlistName || !songs) {
        return res.status(400).json({ error: "Playlist name and songs are required" });
    }

    try {
        const result = await createPlaylist(playlistName, songs);
        res.status(201).json({ message: "Playlist created successfully", result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================================
// =================== D I R E C T O R Y ====================
// ==========================================================

router.get('/get-file-directory', async (req, res) => {
    try {
        const tree = directoryTree(MUSIC_DIRECTORY, {attributes:["size", "type", "extension"]});
        res.json(tree);
    } catch (error: any) {
        res.status(500).json({ error: error?.message });
    }
});


export default router;

