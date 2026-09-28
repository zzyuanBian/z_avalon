/**
 * WebSocket wrapper - event-based API compatible with existing code
 * Replaces socket.io-client with native WebSocket
 */

type EventHandler = (data: any) => void;

class WebSocketWrapper {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private messageQueue: Array<{ type: string; data?: any }> = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectBaseDelay = 1000;
  private isConnecting = false;

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    // Build WebSocket URL from current page location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // includes port
    const url = `${protocol}//${host}/ws`;

    console.log('[ws] connecting to', url);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('[ws] connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.emit('connect', {});

      // Flush message queue
      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift()!;
        this.sendRaw(msg);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type) {
          this.emit(msg.type, msg.data);
        }
      } catch (err) {
        console.error('[ws] parse error:', err);
      }
    };

    this.ws.onclose = (event) => {
      console.log('[ws] closed', event.code, event.reason);
      this.isConnecting = false;
      this.ws = null;
      this.emit('disconnect', { code: event.code, reason: event.reason });

      // Auto-reconnect unless explicitly closed
      if (event.code !== 1000) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('[ws] error:', error);
      this.emit('error', error);
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[ws] max reconnect attempts reached');
      this.emit('reconnect_failed', {});
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts),
      30000
    );
    console.log(`[ws] reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private sendRaw(msg: { type: string; data?: any }): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  emit(event: string, data: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  on(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler?: EventHandler): void {
    if (!handler) {
      this.listeners.delete(event);
    } else {
      this.listeners.get(event)?.delete(handler);
    }
  }

  once(event: string, handler: EventHandler): void {
    const wrapper = (data: any) => {
      handler(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  send(type: string, data?: any): void {
    const msg = { type, data };
    if (this.connected) {
      this.sendRaw(msg);
    } else {
      console.log('[ws] not connected, queueing:', type);
      this.messageQueue.push(msg);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'user disconnect');
      this.ws = null;
    }
  }
}

// Singleton instance
let socket: WebSocketWrapper | null = null;

export function getSocket(): WebSocketWrapper {
  if (!socket) {
    socket = new WebSocketWrapper();
  }
  return socket;
}

export function connectSocket(): WebSocketWrapper {
  const s = getSocket();
  s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
  }
}
