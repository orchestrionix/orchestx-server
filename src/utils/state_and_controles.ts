import { Socket } from "net";
import { TCP_PORT, TCP_HOST } from "./constants";

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
            reject(error);
        });
    });
}

export function extractJson(data: string): any {
    try {
        return JSON.parse(data);
    } catch (error) {
        throw new Error('Failed to parse JSON');
    }
}