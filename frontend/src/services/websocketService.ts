type MessageHandler = (data: any) => void

export class WebSocketService {
  private ws: WebSocket | null = null
  private handlers: Map<string, MessageHandler[]> = new Map()
  private reconnectTimeout: number | null = null
  private url: string = ''

  connect(url: string = 'ws://localhost:8080/ws') {
    this.url = url

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout)
          this.reconnectTimeout = null
        }
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.reconnect()
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      this.reconnect()
    }
  }

  private reconnect() {
    if (this.reconnectTimeout) return

    this.reconnectTimeout = window.setTimeout(() => {
      console.log('Reconnecting WebSocket...')
      this.connect(this.url)
    }, 3000)
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, [])
    }
    this.handlers.get(type)!.push(handler)
  }

  off(type: string, handler: MessageHandler) {
    const handlers = this.handlers.get(type)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private handleMessage(data: any) {
    const { type, payload } = data

    if (!type) {
      console.warn('Received message without type:', data)
      return
    }

    const handlers = this.handlers.get(type)
    if (handlers) {
      handlers.forEach(handler => handler(payload))
    }
  }

  send(type: string, payload: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected')
      return
    }

    this.ws.send(JSON.stringify({ type, payload }))
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

// シングルトンインスタンス
export const websocketService = new WebSocketService()
