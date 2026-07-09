import { useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

export function useWebSocket(
  path: string,
  onMessage: (data: WebSocketMessage) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    const baseUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:2000';
    const ws = new WebSocket(`${baseUrl}${path}`);

    ws.onclose = () => {
      setTimeout(connect, 3000);
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch {
        // invalid JSON
      }
    };

    wsRef.current = ws;
  }, [path]);

  useEffect(() => {
    const timer = setTimeout(connect, 100);
    return () => {
      clearTimeout(timer);
      wsRef.current?.close();
    };
  }, [connect]);

  return wsRef;
}
