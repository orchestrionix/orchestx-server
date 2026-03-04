import WebSocket from 'ws';
import { networkInterfaces, hostname } from 'os';
import { getSettings } from './settings';

/**
 * Checks if the system has internet connectivity
 * by attempting to connect to a reliable external service
 */
async function hasInternetAccess(): Promise<boolean> {
  try {
    const dns = await import('dns/promises');
    await dns.resolve('google.com');
    return true;
  } catch (error) {
    return false;
  }
}

const DEFAULT_PRESENCE_WS_URL = 'wss://orchestx-reddis-production.up.railway.app/ws';

/**
 * Gets the local URL where the React app is accessible.
 * Uses LOCAL_REACT_URL from settings if set, else auto-detects from network + PORT.
 */
function getLocalUrl(settingsLocalUrl?: string, port: string = '4000'): string {
  if (settingsLocalUrl && settingsLocalUrl.trim()) {
    return settingsLocalUrl.trim();
  }

  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    const net = nets[name];
    if (net) {
      for (const iface of net) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return `http://${iface.address}:${port}`;
        }
      }
    }
  }
  return `http://localhost:${port}`;
}

/**
 * Gets the instrument ID from settings or generates one from hostname.
 */
function getInstrumentId(settingsId?: string): string {
  if (settingsId && settingsId.trim()) {
    return settingsId.trim();
  }
  const machineHostname = hostname();
  return `INST-${machineHostname.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`;
}

/**
 * Gets the instrument name from settings or falls back to instrument ID.
 */
function getInstrumentName(settingsName?: string, instrumentId?: string): string {
  if (settingsName && settingsName.trim()) {
    return settingsName.trim();
  }
  return instrumentId ?? getInstrumentId();
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
  private reconnectDelay: number = 1000;
  private maxReconnectDelay: number = 30000;
  private isConnecting: boolean = false;
  private shouldConnect: boolean = false;
  private config: PresenceConfig = {
    wsUrl: DEFAULT_PRESENCE_WS_URL,
    instrumentId: '',
    name: '',
    localUrl: '',
  };

  constructor() {
    // Config is built from settings.ini in start()
  }

  /**
   * Starts the presence client
   * Reads config from settings.ini, checks ENABLE_PRESENCE, then internet access, then connects
   */
  async start(): Promise<void> {
    const settings = await getSettings();
    const enablePresence = settings.ENABLE_PRESENCE?.trim().toLowerCase() === 'true';
    if (!enablePresence) {
      this.shouldConnect = false;
      return;
    }

    this.shouldConnect = true;

    const port = settings.PORT ?? '4000';
    const instrumentId = getInstrumentId(settings.INSTRUMENT_ID);
    this.config = {
      wsUrl: settings.PRESENCE_WS_URL?.trim() || DEFAULT_PRESENCE_WS_URL,
      instrumentId,
      name: getInstrumentName(settings.INSTRUMENT_NAME, instrumentId),
      localUrl: getLocalUrl(settings.LOCAL_REACT_URL, port),
    };

    console.log('Presence Client initialized (from settings.ini):');
    console.log(`  Instrument ID: ${this.config.instrumentId}`);
    console.log(`  Name: ${this.config.name}`);
    console.log(`  Local URL: ${this.config.localUrl}`);
    console.log(`  Presence URL: ${this.config.wsUrl}`);

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
          // console.error('Presence: Failed to parse message:', error);
        }
      });

      this.ws.on('error', (error) => {
        // console.error('Presence: WebSocket error:', error.message);
        this.isConnecting = false;
      });

      this.ws.on('close', (code, reason) => {
        // console.log(`Presence: WebSocket closed (code: ${code}, reason: ${reason.toString()})`);
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
      // console.log('Presence: Sent hello message:', helloMessage);
    } catch (error) {
      // console.error('Presence: Failed to send hello message:', error);
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

