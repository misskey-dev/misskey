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

/**
 * T027: Mobile device detection utility
 * @returns true if the device is a mobile device (phone or tablet)
 */
export function isMobileDevice(): boolean {
	// Check user agent for mobile devices
	const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

	// Match common mobile device patterns
	const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

	// Check for touch support
	const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

	// Check screen width (mobile devices typically have smaller screens)
	const isSmallScreen = window.innerWidth <= 768;

	return mobileRegex.test(userAgent) || (hasTouchSupport && isSmallScreen);
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

	// T039: Cache loaded chunks in memory to avoid redundant database queries
	const loadedChunks = new Set<string>();
	const CHUNK_SIZE = 16;
	const CHUNK_LOAD_DISTANCE = 2; // Load chunks 2 chunks ahead

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

		// T038: Handle chunkGenerated event and render terrain
		channel.on('chunkGenerated', (body: ChunkData) => {
			handleChunkGenerated(body);
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

	// T038: Handle chunkGenerated event and render terrain
	function handleChunkGenerated(data: ChunkData): void {
		if (!engine) return;

		// Mark chunk as loaded (T039: cache)
		const chunkKey = `${data.chunkX},${data.chunkZ}`;
		loadedChunks.add(chunkKey);

		// Render terrain
		engine.loadChunk(data);
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

	// T036-T037: Load nearby chunks using WebSocket chunk generation
	async function loadNearbyChunks(x: number, z: number): Promise<void> {
		if (!channel || !isConnected.value) return;

		const playerChunkX = Math.floor(x / CHUNK_SIZE);
		const playerChunkZ = Math.floor(z / CHUNK_SIZE);

		// T037: Request chunk generation when player approaches ungenerated area (2 chunks ahead)
		for (let dx = -CHUNK_LOAD_DISTANCE; dx <= CHUNK_LOAD_DISTANCE; dx++) {
			for (let dz = -CHUNK_LOAD_DISTANCE; dz <= CHUNK_LOAD_DISTANCE; dz++) {
				const chunkX = playerChunkX + dx;
				const chunkZ = playerChunkZ + dz;
				const chunkKey = `${chunkX},${chunkZ}`;

				// T039: Skip if chunk already loaded (cache check)
				if (loadedChunks.has(chunkKey)) {
					continue;
				}

				// Request chunk generation via WebSocket
				// T040: Concurrent request limit is handled in websocket-sync.ts (MAX_CONCURRENT_CHUNK_REQUESTS = 5)
				try {
					channel.send('generateChunk', {
						chunkX,
						chunkZ,
						worldId: 'default',
					});

					// Optimistically mark as requested (will be added to loadedChunks when chunkGenerated event arrives)
				} catch (e) {
					console.error(`Failed to request chunk ${chunkX},${chunkZ}:`, e);
				}
			}
		}
	}

	function startMovementLoop(): void {
		let lastSendTime = 0;
		const sendInterval = 100; // Send position every 100ms max
		let lastChunkCheckTime = 0;
		const chunkCheckInterval = 1000; // Check for new chunks every 1 second

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

			// T036: Implement player position monitoring for nearby chunk detection
			// T037: Request chunk generation when player approaches ungenerated area
			if (now - lastChunkCheckTime >= chunkCheckInterval) {
				loadNearbyChunks(currentX, currentZ);
				lastChunkCheckTime = now;
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
