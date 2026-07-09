package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type StockMessage struct {
	Type      string `json:"type"`
	ProductID uint   `json:"product_id"`
	Quantity  int    `json:"quantity"`
}

type OrderMessage struct {
	Type          string `json:"type"`
	OrderID       uint   `json:"order_id"`
	InvoiceNumber string `json:"invoice_number"`
	GrandTotal    int64  `json:"grand_total"`
	Status        string `json:"status"`
	PaymentMethod string `json:"payment_method"`
}

type CartMessage struct {
	Type  string `json:"type"`
	Items []CartItem `json:"items"`
	Subtotal int64 `json:"subtotal"`
	VoucherDiscount int64 `json:"voucher_discount"`
	GrandTotal int64 `json:"grand_total"`
}

type CartItem struct {
	ProductID   uint   `json:"product_id"`
	ProductName string `json:"product_name"`
	Price       int64  `json:"price"`
	Quantity    int    `json:"quantity"`
	Image       string `json:"image"`
}

type Hub struct {
	mu              sync.RWMutex
	stockClients    map[*websocket.Conn]bool
	orderClients    map[*websocket.Conn]bool
	cartClients     map[*websocket.Conn]bool
	stockRegister   chan *websocket.Conn
	stockUnregister chan *websocket.Conn
	orderRegister   chan *websocket.Conn
	orderUnregister chan *websocket.Conn
	cartRegister    chan *websocket.Conn
	cartUnregister  chan *websocket.Conn
	stockBroadcast  chan StockMessage
	orderBroadcast  chan OrderMessage
	cartBroadcast   chan CartMessage
}

func NewHub() *Hub {
	return &Hub{
		stockClients:    make(map[*websocket.Conn]bool),
		orderClients:    make(map[*websocket.Conn]bool),
		cartClients:     make(map[*websocket.Conn]bool),
		stockRegister:   make(chan *websocket.Conn),
		stockUnregister: make(chan *websocket.Conn),
		orderRegister:   make(chan *websocket.Conn),
		orderUnregister: make(chan *websocket.Conn),
		cartRegister:    make(chan *websocket.Conn),
		cartUnregister:  make(chan *websocket.Conn),
		stockBroadcast:  make(chan StockMessage, 256),
		orderBroadcast:  make(chan OrderMessage, 256),
		cartBroadcast:   make(chan CartMessage, 256),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case conn := <-h.stockRegister:
			h.mu.Lock()
			h.stockClients[conn] = true
			h.mu.Unlock()

		case conn := <-h.stockUnregister:
			h.mu.Lock()
			if _, ok := h.stockClients[conn]; ok {
				delete(h.stockClients, conn)
				conn.Close()
			}
			h.mu.Unlock()

		case conn := <-h.orderRegister:
			h.mu.Lock()
			h.orderClients[conn] = true
			h.mu.Unlock()

		case conn := <-h.orderUnregister:
			h.mu.Lock()
			if _, ok := h.orderClients[conn]; ok {
				delete(h.orderClients, conn)
				conn.Close()
			}
			h.mu.Unlock()

		case conn := <-h.cartRegister:
			h.mu.Lock()
			h.cartClients[conn] = true
			h.mu.Unlock()

		case conn := <-h.cartUnregister:
			h.mu.Lock()
			if _, ok := h.cartClients[conn]; ok {
				delete(h.cartClients, conn)
				conn.Close()
			}
			h.mu.Unlock()

		case msg := <-h.stockBroadcast:
			h.mu.RLock()
			for conn := range h.stockClients {
				data, err := json.Marshal(msg)
				if err != nil {
					continue
				}
				if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
					go func(c *websocket.Conn) {
						h.stockUnregister <- c
					}(conn)
				}
			}
			h.mu.RUnlock()

		case msg := <-h.orderBroadcast:
			h.mu.RLock()
			for conn := range h.orderClients {
				data, err := json.Marshal(msg)
				if err != nil {
					continue
				}
				if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
					go func(c *websocket.Conn) {
						h.orderUnregister <- c
					}(conn)
				}
			}
			h.mu.RUnlock()

		case msg := <-h.cartBroadcast:
			h.mu.RLock()
			for conn := range h.cartClients {
				data, err := json.Marshal(msg)
				if err != nil {
					continue
				}
				if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
					go func(c *websocket.Conn) {
						h.cartUnregister <- c
					}(conn)
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) BroadcastStock(msg StockMessage) {
	select {
	case h.stockBroadcast <- msg:
	default:
	}
}

func (h *Hub) BroadcastOrder(msg OrderMessage) {
	select {
	case h.orderBroadcast <- msg:
	default:
	}
}

func (h *Hub) BroadcastCart(msg CartMessage) {
	select {
	case h.cartBroadcast <- msg:
	default:
	}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func HandleStockWS(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket stock upgrade error: %v", err)
		return
	}
	hub.stockRegister <- conn
	defer func() {
		hub.stockUnregister <- conn
	}()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

func HandleOrderWS(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket order upgrade error: %v", err)
		return
	}
	hub.orderRegister <- conn
	defer func() {
		hub.orderUnregister <- conn
	}()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

func HandleCartWS(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket cart upgrade error: %v", err)
		return
	}
	hub.cartRegister <- conn
	defer func() {
		hub.cartUnregister <- conn
	}()

	for {
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			break
		}
		var msg CartMessage
		if err := json.Unmarshal(msgBytes, &msg); err != nil {
			continue
		}
		msg.Type = "cart_update"
		hub.BroadcastCart(msg)
	}
}
