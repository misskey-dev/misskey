/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import { useStream } from '@/stream.js';
import { NoctownEngine, type PlayerData, type ChunkData } from './engine.js';

export interface NoctownState {
	isConnected: Ref<boolean>;
	isLoading: Ref<boolean>;
	error: Ref<string | null>;
	playerData: Ref<PlayerData | null>;
}

interface NoctownPlayerResponse {
	id: string;
	positionX: number;
	positionY: number;
	positionZ: number;
	rotation: number;
	isOnline: boolean;
	balance: string;
	totalScore: number;
	createdAt: string;
}

interface NoctownNearbyPlayer {
	id: string;
	userId: string;
	username: string;
	avatarUrl: string | null;
	positionX: number;
	positionY: number;
	positionZ: number;
	rotation: number;
	isOnline: boolean;
}

function getToken(): string | null {
	const account = localStorage.getItem('account');
	if (!account) return null;
	try {
		return JSON.parse(account).token;
	} catch {
		return null;
	}
}

export function useNoctown(containerRef: Ref<HTMLElement | null>): NoctownState {
	const isConnected = ref(false);
	const isLoading = ref(true);
	const error = ref<string | null>(null);
	const playerData = ref<PlayerData | null>(null);

	let engine: NoctownEngine | null = null;
	let stream: ReturnType<typeof useStream> | null = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let channel: any = null;
	let moveInterval: ReturnType<typeof setInterval> | null = null;
	let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

	// Movement state
	let currentX = 0;
	let currentY = 0;
	let currentZ = 0;
	let currentRotation = 0;
	const moveSpeed = 0.15;

	async function initialize(): Promise<void> {
		try {
			isLoading.value = true;
			error.value = null;

			// Fetch player data
			const res = await window.fetch('/api/noctown/player', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({ i: getToken() }),
			});

			if (!res.ok) {
				throw new Error('Failed to fetch player data');
			}

			const data: NoctownPlayerResponse = await res.json();
			playerData.value = {
				id: data.id,
				userId: '',
				username: '',
				avatarUrl: null,
				positionX: data.positionX,
				positionY: data.positionY,
				positionZ: data.positionZ,
				rotation: data.rotation,
				isOnline: data.isOnline,
			};

			currentX = data.positionX;
			currentY = data.positionY;
			currentZ = data.positionZ;
			currentRotation = data.rotation;

			// Initialize engine
			if (containerRef.value) {
				engine = new NoctownEngine(containerRef.value);
				engine.createLocalPlayer(playerData.value);

				// Load initial chunks around player
				await loadNearbyChunks(currentX, currentZ);
			}

			// Connect to WebSocket
			await connectStream();

			isLoading.value = false;
		} catch (e) {
			console.error('Failed to initialize Noctown:', e);
			error.value = e instanceof Error ? e.message : 'Unknown error';
			isLoading.value = false;
		}
	}

	async function connectStream(): Promise<void> {
		stream = useStream();
		channel = stream.useChannel('noctown');

		// Handle incoming events
		channel.on('playerMoved', (body: PlayerData) => {
			handlePlayerMoved(body);
		});
		channel.on('playerJoined', (body: PlayerData) => {
			handlePlayerJoined(body);
		});
		channel.on('playerLeft', (body: { playerId: string }) => {
			handlePlayerLeft(body);
		});

		isConnected.value = true;

		// Start movement loop
		startMovementLoop();

		// Start heartbeat
		startHeartbeat();

		// Fetch nearby players
		await fetchNearbyPlayers();
	}

	function handlePlayerMoved(data: PlayerData): void {
		if (!engine || data.id === playerData.value?.id) return;
		engine.updateRemotePlayer(data);
	}

	function handlePlayerJoined(data: PlayerData): void {
		if (!engine || data.id === playerData.value?.id) return;
		engine.addRemotePlayer(data);
	}

	function handlePlayerLeft(data: { playerId: string }): void {
		if (!engine) return;
		engine.removeRemotePlayer(data.playerId);
	}

	async function fetchNearbyPlayers(): Promise<void> {
		try {
			const res = await window.fetch('/api/noctown/players/nearby', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'same-origin',
				body: JSON.stringify({ i: getToken(), x: currentX, z: currentZ, radius: 50 }),
			});

			if (!res.ok) return;

			const players: NoctownNearbyPlayer[] = await res.json();

			if (!engine) return;

			for (const player of players) {
				engine.addRemotePlayer(player);
			}
		} catch (e) {
			console.error('Failed to fetch nearby players:', e);
		}
	}

	async function loadNearbyChunks(x: number, z: number): Promise<void> {
		const chunkX = Math.floor(x / 16);
		const chunkZ = Math.floor(z / 16);

		// Load 3x3 chunks around player
		for (let dx = -1; dx <= 1; dx++) {
			for (let dz = -1; dz <= 1; dz++) {
				try {
					const res = await window.fetch('/api/noctown/map/chunk', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'same-origin',
						body: JSON.stringify({ i: getToken(), chunkX: chunkX + dx, chunkZ: chunkZ + dz }),
					});

					if (!res.ok) continue;

					const chunk: ChunkData = await res.json();
					if (engine) {
						engine.loadChunk(chunk);
					}
				} catch (e) {
					console.error(`Failed to load chunk ${chunkX + dx},${chunkZ + dz}:`, e);
				}
			}
		}
	}

	function startMovementLoop(): void {
		let lastSendTime = 0;
		const sendInterval = 100; // Send position every 100ms max

		moveInterval = setInterval(() => {
			if (!engine || !isConnected.value) return;

			const input = engine.getMovementInput();
			if (!engine.isMoving()) return;

			// Update local position
			currentX += input.x * moveSpeed;
			currentZ += input.z * moveSpeed;
			if (input.x !== 0 || input.z !== 0) {
				currentRotation = input.rotation;
			}

			// Update engine
			engine.updateLocalPlayerPosition(currentX, currentY, currentZ, currentRotation);

			// Send to server (throttled)
			const now = Date.now();
			if (now - lastSendTime >= sendInterval) {
				sendPosition();
				lastSendTime = now;
			}
		}, 16); // ~60fps
	}

	function sendPosition(): void {
		if (!channel || !isConnected.value) return;

		try {
			channel.send('move', {
				x: currentX,
				y: currentY,
				z: currentZ,
				rotation: currentRotation,
			});
		} catch (e) {
			console.error('Failed to send position:', e);
		}
	}

	function startHeartbeat(): void {
		heartbeatInterval = setInterval(() => {
			if (!channel || !isConnected.value) return;
			channel.send('heartbeat', {});
		}, 30000); // Every 30 seconds
	}

	function cleanup(): void {
		if (moveInterval) {
			clearInterval(moveInterval);
			moveInterval = null;
		}

		if (heartbeatInterval) {
			clearInterval(heartbeatInterval);
			heartbeatInterval = null;
		}

		if (channel) {
			channel.dispose();
			channel = null;
		}

		if (engine) {
			engine.dispose();
			engine = null;
		}

		isConnected.value = false;
	}

	onMounted(() => {
		initialize();
	});

	onUnmounted(() => {
		cleanup();
	});

	return {
		isConnected,
		isLoading,
		error,
		playerData,
	};
}
