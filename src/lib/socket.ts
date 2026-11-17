import { io, Socket } from "socket.io-client";

// Socket server defaults to the origin of the REST API (VITE_API_BASE_URL);
// override with VITE_SOCKET_URL if the socket server is hosted elsewhere.
const SOCKET_SERVER_URL: string =
	import.meta.env.VITE_SOCKET_URL ||
	(import.meta.env.VITE_API_BASE_URL
		? new URL(import.meta.env.VITE_API_BASE_URL).origin
		: "http://localhost:3000");

let socket: Socket | null = null;
let listenersInitialized = false;

const initializeListeners = () => {
	if (!socket || listenersInitialized) return;

	socket.on("connect", () => {
		console.log("Socket connected:", socket?.id);
	});

	socket.on("disconnect", () => {
		console.log("Socket disconnected");
	});

	socket.on("connect_error", (err) => {
		console.error("Socket connection error:", err);
	});

	listenersInitialized = true;
};

export const initializeSocket = (token: string) => {
	if (!socket) {
		socket = io(SOCKET_SERVER_URL.replace("https","wss"), {
			auth: { token },
			autoConnect: true,
			reconnection: true,
			path: "/socket.io",
			transports: ["websocket"],
		});

		initializeListeners();
	}
	return socket;
};

export const getSocket = () => {
	if (!socket) {
		throw new Error("Socket not initialized. Call initializeSocket first.");
	}
	return socket;
};

export const disconnectSocket = () => {
	if (socket) {
		socket.disconnect();
		socket = null;
		listenersInitialized = false;
		console.log("Socket disconnected and cleaned up");
	}
};

export const updateSocketToken = (newToken: string) => {
	if (socket) {
		socket.auth = { token: newToken };
		// Force reconnection with new token if needed
		if (!socket.connected) {
			socket.connect();
		}
	}
};
