import { Socket } from "net";
import { TCP_PORT, TCP_HOST } from "./constants";
import { extractJson } from ".";

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

export async function TCPRemotePlayerActivePlaylist(): Promise<any> {
    return new Promise((resolve, reject) => {
        const client = new Socket();

        client.connect(TCP_PORT, TCP_HOST, () => {
            const command = "GetPlaylist\n";
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

export async function TCPPlayItemRemotePlayer(index: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const client = new Socket();

        client.connect(TCP_PORT, TCP_HOST, () => {
            const command = `PlayItem ${index + 1}\n`;
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
