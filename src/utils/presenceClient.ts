import WebSocket from 'ws';
import { networkInterfaces, hostname } from 'os';

/**
 * Checks if the system has internet connectivity
 * by attempting to connect to a reliable external service
 */
async function hasInternetAccess(): Promise<boolean> {
  try {
    // Try to resolve a well-known DNS server
    // This is a lightweight check that doesn't require HTTP
    const dns = await import('dns/promises');
    await dns.resolve('google.com');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Gets the local URL where the React app is accessible
 * Falls back to building from hostname and port if not provided
 */
function getLocalUrl(): string {
  const envUrl = process.env.LOCAL_REACT_URL;
  if (envUrl) {
    return envUrl;
  }

  // Try to get the local IP address
  const nets = networkInterfaces();
  const PORT = process.env.PORT || '4000';
  
  for (const name of Object.keys(nets)) {
    const net = nets[name];
    if (net) {
      for (const iface of net) {
        // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          return `http://${iface.address}:${PORT}`;
        }
      }
    }
  }

  // Fallback to localhost
  return `http://localhost:${PORT}`;
}

/**
 * Gets the instrument ID from environment variable
 * Falls back to a generated stable ID if not provided
 */
function getInstrumentId(): string {
  const envId = process.env.INSTRUMENT_ID;
  if (envId) {
    return envId;
  }

  // Generate a stable ID based on machine hostname
  // This ensures the same ID across reboots on the same machine
  const machineHostname = hostname();
  return `INST-${machineHostname.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`;
}

/**
 * Gets the instrument name from environment variable
 * Falls back to instrument ID if not provided
 */
function getInstrumentName(): string {
  return process.env.INSTRUMENT_NAME || getInstrumentId();
}

interface PresenceConfig {
  wsUrl: string;
  instrumentId: string;
  name: string;
  localUrl: string;
}

/**
 * Presence WebSocket Client
 * Connects to the Railway presence service to announce instrument availability
 */
export class PresenceClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectDelay: number = 1000; // Start with 1 second
  private maxReconnectDelay: number = 30000; // Max 30 seconds
  private isConnecting: boolean = false;
  private shouldConnect: boolean = true;
  private config: PresenceConfig;

  constructor() {
    const wsUrl = process.env.PRESENCE_WS_URL || 'wss://orchestx-reddis-production.up.railway.app/ws';
    
    this.config = {
      wsUrl,
      instrumentId: getInstrumentId(),
      name: getInstrumentName(),
      localUrl: getLocalUrl(),
    };

    console.log('Presence Client initialized:');
    console.log(`  Instrument ID: ${this.config.instrumentId}`);
    console.log(`  Name: ${this.config.name}`);
    console.log(`  Local URL: ${this.config.localUrl}`);
    console.log(`  Presence URL: ${this.config.wsUrl}`);
  }

  /**
   * Starts the presence client
   * Checks for internet access first, then connects
   */
  async start(): Promise<void> {
    if (!this.shouldConnect) {
      return;
    }

    // Check internet connectivity before attempting connection
    const hasInternet = await hasInternetAccess();
    if (!hasInternet) {
      console.log('Presence: No internet access detected. Skipping presence announcement.');
      // Retry connectivity check after a delay
      this.reconnectTimer = setTimeout(() => {
        this.start();
      }, 10000); // Check every 10 seconds
      return;
    }

    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return; // Already connecting or connected
    }

    this.isConnecting = true;
    this.connect();
  }

  /**
   * Establishes WebSocket connection to presence service
   */
  private connect(): void {
    try {
      console.log(`Presence: Connecting to ${this.config.wsUrl}...`);
      
      this.ws = new WebSocket(this.config.wsUrl);

      this.ws.on('open', () => {
        console.log('Presence: WebSocket connection opened');
        this.isConnecting = false;
        this.reconnectDelay = 1000; // Reset delay on successful connection
        
        // Send hello message immediately
        this.sendHello();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('Presence: Failed to parse message:', error);
        }
      });

      this.ws.on('error', (error) => {
        console.error('Presence: WebSocket error:', error.message);
        this.isConnecting = false;
      });

      this.ws.on('close', (code, reason) => {
        console.log(`Presence: WebSocket closed (code: ${code}, reason: ${reason.toString()})`);
        this.isConnecting = false;
        this.ws = null;

        // Attempt to reconnect if we should be connected
        if (this.shouldConnect) {
          this.scheduleReconnect();
        }
      });

    } catch (error) {
      console.error('Presence: Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      if (this.shouldConnect) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Sends the hello message to the presence server
   */
  private sendHello(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const helloMessage = {
      type: 'hello',
      instrumentId: this.config.instrumentId,
      name: this.config.name,
      localUrl: this.config.localUrl,
    };

    try {
      this.ws.send(JSON.stringify(helloMessage));
      console.log('Presence: Sent hello message:', helloMessage);
    } catch (error) {
      console.error('Presence: Failed to send hello message:', error);
    }
  }

  /**
   * Handles incoming messages from the presence server
   */
  private handleMessage(message: any): void {
    if (message.type === 'helloAck') {
      console.log(`Presence: Registered as ${message.instrumentId || this.config.instrumentId}`);
    } else if (message.type === 'error') {
      console.error('Presence: Server error:', message.message || message.error || 'Unknown error');
    } else {
      console.log('Presence: Received message:', message);
    }
  }

  /**
   * Schedules a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return; // Already scheduled
    }

    const delay = this.reconnectDelay;
    console.log(`Presence: Scheduling reconnect in ${delay}ms...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      // Increase delay for next attempt (with max limit)
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      this.start();
    }, delay);
  }

  /**
   * Stops the presence client and closes the connection
   */
  stop(): void {
    this.shouldConnect = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    console.log('Presence: Client stopped');
  }
}

