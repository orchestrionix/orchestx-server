import { Socket } from "net";
import { TCP_PORT, TCP_HOST } from "./constants";
import { extractJson } from ".";

/**
 * Helper function to properly handle TCP streaming for JSON responses.
 * Buffers all incoming chunks until a complete JSON response is received.
 * 
 * @param client - The TCP socket client
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns Promise that resolves with the parsed JSON response
 */
function receiveJsonResponse(client: Socket, timeoutMs: number = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
        let buffer = '';
        let timeout: NodeJS.Timeout | null = null;
        let isResolved = false;

        const cleanup = () => {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            if (!isResolved) {
                isResolved = true;
            }
        };

        const tryParse = () => {
            try {
                // Try to parse the accumulated buffer as JSON
                const parsed = JSON.parse(buffer);
                cleanup();
                client.destroy();
                resolve(parsed);
                return true;
            } catch (error) {
                // JSON is incomplete, wait for more data
                return false;
            }
        };

        // Set up timeout
        timeout = setTimeout(() => {
            if (!isResolved) {
                cleanup();
                client.destroy();
                reject(new Error('Timeout waiting for complete JSON response'));
            }
        }, timeoutMs);

        // Handle incoming data chunks
        client.on('data', (data: Buffer) => {
            if (isResolved) return;
            
            // Append new chunk to buffer
            buffer += data.toString();
            
            // Try to parse complete JSON
            tryParse();
        });

        // Handle connection end (server closed the connection)
        client.on('end', () => {
            if (isResolved) return;
            
            // Try to parse whatever we have
            if (buffer.trim()) {
                try {
                    const parsed = JSON.parse(buffer);
                    cleanup();
                    resolve(parsed);
                } catch (error) {
                    cleanup();
                    reject(new Error('Incomplete JSON response received'));
                }
            } else {
                cleanup();
                reject(new Error('No data received'));
            }
        });

        // Handle errors
        client.on('error', (error: Error) => {
            if (!isResolved) {
                cleanup();
                reject(error);
            }
        });
    });
}

export async function TCPPrevRemotePlayer(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const client = new Socket();

        client.connect(TCP_PORT, TCP_HOST, () => {
            const command = "Prev\n";
            client.write(command);
        });

        client.on('data', (data) => {
            client.destroy();
            resolve(true);
        });

        client.on('error', (error) => {
            client.destroy();
            reject(error);
        });
    });
}

export async function TCPNextRemotePlayer(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const client = new Socket();

        client.connect(TCP_PORT, TCP_HOST, () => {
            const command = "Next\n";
            client.write(command);
        });

        client.on('data', (data) => {
            client.destroy();
            resolve(true);
        });

        client.on('error', (error) => {
            client.destroy();
            reject(error);
        });
    });
}

export async function TCPToggleRemotePlayer(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const client = new Socket();

        client.connect(TCP_PORT, TCP_HOST, () => {
            const command = "PlayPause\n";
            client.write(command);
        });

        client.on('data', (data) => {
            client.destroy();
            resolve(true);
        });

        client.on('error', (error) => {
            client.destroy();
            reject(error);
        });
    });
}

export async function TCPRemotePlayerState(): Promise<any> {
    return new Promise((resolve, reject) => {
        

        const client = new Socket();

        client.connect(TCP_PORT, TCP_HOST, () => {
            const command = "GetState\n";
            client.write(command);
        });

        client.on('data', (data: any) => {
            client.destroy();
            resolve(extractJson(data.toString()));
        });

        client.on('error', (error: any) => {
            client.destroy();

            // resolve with error state
            resolve({
                state: {
                    status: "error",
                    title: "No connection to remote player",
                    itemId: 0,
                    length: 0,
                    position: 0,
                    volume: 0,
                    viewMode: 0,
                }
            });
        });
    });
}

export async function TCPRemotePlayerActivePlaylist(): Promise<any> {
    return new Promise((resolve, reject) => {
        const client = new Socket();

        // Use proper TCP buffering to handle multi-chunk responses
        receiveJsonResponse(client, 5000)
            .then((result) => {
                console.log("GetPlaylist response received:", result);
                resolve(result);
            })
            .catch((error) => {
                console.error("GetPlaylist error:", error);
                reject(error);
            });

        client.connect(TCP_PORT, TCP_HOST, () => {
            const command = "GetPlaylist\n";
            client.write(command);
        });
    });
}

export async function TCPPlayItemRemotePlayer(index: string): Promise<any> {
    // console.log("play item: at index", Number(index));

    return new Promise((resolve, reject) => {
        const client = new Socket();

        client.connect(TCP_PORT, TCP_HOST, () => {
            const command = `PlayItem ${Number(index) + 1}\n`;
            client.write(command);
        });

        client.on('data', (data) => {
            client.destroy();
            resolve(true);
        });

        client.on('error', (error) => {
            client.destroy();
            reject(error);
        });
    });
}

export async function TCPSelectItemRemotePlayer(index: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const client = new Socket();

        client.connect(TCP_PORT, TCP_HOST, () => {
            const command = `SelectItem ${index + 1}\n`;
            client.write(command);
        });

        client.on('data', (data) => {
            client.destroy();
            resolve(true);
        });

        client.on('error', (error) => {
            client.destroy();
            reject(error);
        });
    });
}

export async function TCPLoadPlaylistRemotePlayer(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const client = new Socket();

        client.connect(TCP_PORT, TCP_HOST, () => {
            const command = path.includes(' ') ? 
                `LoadPlaylist "${path}"\n` :
                `LoadPlaylist ${path}\n`;
            client.write(command);
        });

        client.on('data', (data) => {
            client.destroy();
            resolve(true);
        });

        client.on('error', (error) => {
            client.destroy();
            reject(error);
        });
    });
}

export async function TCPSetVolumeRemotePlayer(volume: number): Promise<boolean> {
    // Ensure volume is within the valid range (0-65535)
    const validVolume = Math.max(0, Math.min(65535, volume));
    
    return new Promise((resolve, reject) => {
        const client = new Socket();
        
        // Add connection timeout
        const timeout = setTimeout(() => {
            client.destroy();
            reject(new Error('Connection timeout while setting volume'));
        }, 5000); // 5 second timeout
        
        client.connect(TCP_PORT, TCP_HOST, () => {
            const command = `SetVolume ${validVolume}\n`;
            client.write(command);
            
            // Some TCP servers might not send a response for certain commands
            // Resolve after a short delay if no data event occurs
            setTimeout(() => {
                clearTimeout(timeout);
                client.destroy();
                resolve(true);
            }, 500); // 500ms should be enough for most responses
        });

        client.on('data', (data) => {
            clearTimeout(timeout);
            client.destroy();
            resolve(true);
        });

        client.on('error', (error) => {
            clearTimeout(timeout);
            client.destroy();
            reject(error);
        });
    });
}

export async function TCPSetViewModeRemotePlayer(viewMode: number): Promise<boolean> {
    // Ensure view mode is within the valid range (0-5)
    const validViewMode = Math.max(0, Math.min(5, viewMode));
    
    return new Promise((resolve, reject) => {
        const client = new Socket();
        
        // Add connection timeout
        const timeout = setTimeout(() => {
            client.destroy();
            reject(new Error('Connection timeout while setting view mode'));
        }, 5000); // 5 second timeout
        
        client.connect(TCP_PORT, TCP_HOST, () => {
            const command = `SetViewMode ${validViewMode}\n`;
            client.write(command);
            
            // Some TCP servers might not send a response for certain commands
            // Resolve after a short delay if no data event occurs
            setTimeout(() => {
                clearTimeout(timeout);
                client.destroy();
                resolve(true);
            }, 500); // 500ms should be enough for most responses
        });

        client.on('data', (data) => {
            clearTimeout(timeout);
            client.destroy();
            resolve(true);
        });

        client.on('error', (error) => {
            clearTimeout(timeout);
            client.destroy();
            reject(error);
        });
    });
}
