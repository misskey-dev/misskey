<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.container">
	<!-- Canvas for 3D interior rendering -->
	<canvas ref="canvasRef" :class="$style.canvas"></canvas>

	<!-- Interior UI overlay -->
	<div :class="$style.overlay">
		<!-- House name and owner info -->
		<div :class="$style.header">
			<h2 :class="$style.houseName">{{ houseName }}</h2>
			<span v-if="isOwner" :class="$style.ownerBadge">オーナー</span>
		</div>

		<!-- Furniture placement mode toggle (owner only) -->
		<div v-if="isOwner" :class="$style.modeControls">
			<MkButton
				:class="{ [$style.activeMode]: editMode === 'none' }"
				small
				@click="editMode = 'none'"
			>
				<i class="ti ti-eye"></i> 閲覧
			</MkButton>
			<MkButton
				:class="{ [$style.activeMode]: editMode === 'furniture' }"
				small
				@click="editMode = 'furniture'"
			>
				<i class="ti ti-armchair"></i> 家具配置
			</MkButton>
			<MkButton
				:class="{ [$style.activeMode]: editMode === 'wall' }"
				small
				@click="editMode = 'wall'"
			>
				<i class="ti ti-photo"></i> 壁装飾
			</MkButton>
		</div>

		<!-- Furniture list (edit mode) -->
		<div v-if="isOwner && editMode === 'furniture'" :class="$style.furniturePanel">
			<h3>配置済み家具</h3>
			<div :class="$style.furnitureList">
				<div
					v-for="furn in placedFurniture"
					:key="furn.id"
					:class="[$style.furnitureItem, { [$style.selected]: selectedFurniture === furn.id }]"
					@click="selectFurniture(furn.id)"
				>
					<img v-if="furn.item?.imageUrl" :src="furn.item.imageUrl" :alt="furn.item?.name">
					<span>{{ furn.item?.name ?? '不明' }}</span>
				</div>
			</div>
			<div v-if="selectedFurniture" :class="$style.furnitureActions">
				<MkButton small danger @click="removeFurniture">
					<i class="ti ti-trash"></i> 撤去
				</MkButton>
			</div>
		</div>

		<!-- Wall decorations (edit mode) -->
		<div v-if="isOwner && editMode === 'wall'" :class="$style.wallPanel">
			<h3>壁の装飾</h3>
			<div :class="$style.wallPositions">
				<MkButton
					v-for="pos in wallPositions"
					:key="pos"
					:class="{ [$style.activeWall]: selectedWall === pos }"
					small
					@click="selectWall(pos)"
				>
					{{ wallPositionNames[pos] }}
				</MkButton>
			</div>
			<div v-if="selectedWall" :class="$style.wallItems">
				<h4>{{ wallPositionNames[selectedWall] }}の壁</h4>
				<div
					v-for="item in getWallItems(selectedWall)"
					:key="item.id"
					:class="$style.wallItem"
				>
					<div :class="$style.wallItemType">{{ item.type === 'wallpaper' ? '壁紙' : '額縁' }}</div>
					<img v-if="item.baseItem?.imageUrl" :src="item.baseItem.imageUrl" :alt="item.baseItem?.name">
					<span>{{ item.baseItem?.name ?? '不明' }}</span>
					<template v-if="item.type === 'frame' && item.attachedItem">
						<div :class="$style.frameContent">
							<img v-if="item.attachedItem.imageUrl" :src="item.attachedItem.imageUrl" :alt="item.attachedItem.name">
							<span>{{ item.attachedItem.name }}</span>
						</div>
					</template>
					<MkButton small danger @click="removeWallItem(item.id)">
						<i class="ti ti-x"></i>
					</MkButton>
				</div>
			</div>
		</div>

		<!-- Exit button -->
		<div :class="$style.exitArea">
			<MkButton @click="exitHouse">
				<i class="ti ti-door-exit"></i> 外に出る
			</MkButton>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import * as THREE from 'three';
import MkButton from '@/components/MkButton.vue';
import { misskeyApi } from '@/utility/misskey-api.js';

interface InteriorTile {
	type: 'floor' | 'wall' | 'door' | 'counter' | 'furniture' | 'empty';
	variant: number;
}

interface FurnitureItem {
	id: string;
	positionX: number;
	positionZ: number;
	rotation: number;
	item: {
		id: string;
		name: string;
		imageUrl: string | null;
	} | null;
}

interface WallItem {
	id: string;
	type: 'wallpaper' | 'frame';
	wallPosition: string;
	positionIndex: number;
	baseItem: {
		id: string;
		name: string;
		imageUrl: string | null;
	} | null;
	attachedItem: {
		id: string;
		name: string;
		imageUrl: string | null;
		isPlayerCreated: boolean;
	} | null;
}

interface InteriorData {
	id: string;
	name: string;
	width: number;
	depth: number;
	entryX: number;
	entryZ: number;
	tiles: InteriorTile[][];
	furniture: Array<{ id: string; itemId: string; positionX: number; positionZ: number; rotation: number }>;
}

const props = defineProps<{
	houseId: string;
	interior: InteriorData;
	isOwner: boolean;
}>();

const emit = defineEmits<{
	(e: 'exit', position: { x: number; y: number; z: number }): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const editMode = ref<'none' | 'furniture' | 'wall'>('none');
const selectedFurniture = ref<string | null>(null);
const selectedWall = ref<string | null>(null);
const placedFurniture = ref<FurnitureItem[]>([]);
const wallItems = ref<WallItem[]>([]);

// Three.js objects
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let animationFrameId: number | null = null;

const wallPositions = ['north', 'east', 'south', 'west'] as const;
const wallPositionNames: Record<string, string> = {
	north: '北',
	east: '東',
	south: '南',
	west: '西',
};

const houseName = computed(() => props.interior.name ?? 'マイホーム');

onMounted(async () => {
	initThreeJS();
	await loadFurniture();
	await loadWallItems();
});

onUnmounted(() => {
	if (animationFrameId) {
		cancelAnimationFrame(animationFrameId);
	}
	if (renderer) {
		renderer.dispose();
	}
});

function initThreeJS() {
	if (!canvasRef.value) return;

	// Scene setup
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xf5f5f5);

	// Camera
	camera = new THREE.PerspectiveCamera(60, canvasRef.value.clientWidth / canvasRef.value.clientHeight, 0.1, 100);
	camera.position.set(props.interior.width / 2, 8, props.interior.depth + 3);
	camera.lookAt(props.interior.width / 2, 0, props.interior.depth / 2);

	// Renderer
	renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true });
	renderer.setSize(canvasRef.value.clientWidth, canvasRef.value.clientHeight);
	renderer.shadowMap.enabled = true;

	// Lighting
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
	scene.add(ambientLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
	directionalLight.position.set(5, 10, 5);
	directionalLight.castShadow = true;
	scene.add(directionalLight);

	// Create interior from tiles
	createInteriorMeshes();

	// Animation loop
	animate();
}

function createInteriorMeshes() {
	if (!scene) return;

	const tiles = props.interior.tiles;
	const tileSize = 1;

	// Floor material
	const floorMaterial = new THREE.MeshStandardMaterial({
		color: 0xdeb887,
		roughness: 0.8,
	});

	// Wall material
	const wallMaterial = new THREE.MeshStandardMaterial({
		color: 0xf5f5dc,
		roughness: 0.6,
	});

	for (let x = 0; x < tiles.length; x++) {
		for (let z = 0; z < tiles[x].length; z++) {
			const tile = tiles[x][z];

			if (tile.type === 'floor') {
				const floorGeometry = new THREE.BoxGeometry(tileSize, 0.1, tileSize);
				const floor = new THREE.Mesh(floorGeometry, floorMaterial);
				floor.position.set(x + 0.5, 0, z + 0.5);
				floor.receiveShadow = true;
				scene.add(floor);
			} else if (tile.type === 'wall') {
				// Floor under wall
				const floorGeometry = new THREE.BoxGeometry(tileSize, 0.1, tileSize);
				const floor = new THREE.Mesh(floorGeometry, floorMaterial);
				floor.position.set(x + 0.5, 0, z + 0.5);
				scene.add(floor);

				// Wall
				const wallGeometry = new THREE.BoxGeometry(tileSize, 2.5, tileSize);
				const wall = new THREE.Mesh(wallGeometry, wallMaterial);
				wall.position.set(x + 0.5, 1.25, z + 0.5);
				wall.castShadow = true;
				scene.add(wall);
			} else if (tile.type === 'door') {
				// Floor at door
				const floorGeometry = new THREE.BoxGeometry(tileSize, 0.1, tileSize);
				const floor = new THREE.Mesh(floorGeometry, floorMaterial);
				floor.position.set(x + 0.5, 0, z + 0.5);
				scene.add(floor);

				// Door frame (lower wall segments)
				const doorFrameMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
				const frameGeometry = new THREE.BoxGeometry(0.1, 2, tileSize);
				const leftFrame = new THREE.Mesh(frameGeometry, doorFrameMaterial);
				leftFrame.position.set(x, 1, z + 0.5);
				scene.add(leftFrame);
				const rightFrame = new THREE.Mesh(frameGeometry, doorFrameMaterial);
				rightFrame.position.set(x + 1, 1, z + 0.5);
				scene.add(rightFrame);
			}
		}
	}
}

function animate() {
	if (!renderer || !scene || !camera) return;

	animationFrameId = requestAnimationFrame(animate);
	renderer.render(scene, camera);
}

async function loadFurniture() {
	try {
		const result = await misskeyApi('noctown/house/furniture/list', {
			houseId: props.houseId,
		});
		placedFurniture.value = result as FurnitureItem[];
	} catch (e) {
		console.error('Failed to load furniture:', e);
	}
}

async function loadWallItems() {
	try {
		const result = await misskeyApi('noctown/house/wall/list', {
			houseId: props.houseId,
		});
		wallItems.value = result as WallItem[];
	} catch (e) {
		console.error('Failed to load wall items:', e);
	}
}

function selectFurniture(id: string) {
	selectedFurniture.value = selectedFurniture.value === id ? null : id;
}

function selectWall(position: string) {
	selectedWall.value = selectedWall.value === position ? null : position;
}

function getWallItems(position: string): WallItem[] {
	return wallItems.value.filter(item => item.wallPosition === position);
}

async function removeFurniture() {
	if (!selectedFurniture.value) return;

	try {
		await misskeyApi('noctown/house/furniture/remove', {
			houseId: props.houseId,
			furnitureId: selectedFurniture.value,
		});
		selectedFurniture.value = null;
		await loadFurniture();
	} catch (e) {
		console.error('Failed to remove furniture:', e);
	}
}

async function removeWallItem(wallItemId: string) {
	try {
		await misskeyApi('noctown/house/wall/remove', {
			houseId: props.houseId,
			wallItemId,
		});
		await loadWallItems();
	} catch (e) {
		console.error('Failed to remove wall item:', e);
	}
}

async function exitHouse() {
	try {
		const result = await misskeyApi('noctown/house/exit', {
			houseId: props.houseId,
		});
		emit('exit', result.exitPosition);
	} catch (e) {
		console.error('Failed to exit house:', e);
	}
}
</script>

<style lang="scss" module>
.container {
	position: relative;
	width: 100%;
	height: 100%;
	background: #000;
}

.canvas {
	width: 100%;
	height: 100%;
}

.overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	pointer-events: none;
	display: flex;
	flex-direction: column;
}

.header {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px;
	background: rgba(0, 0, 0, 0.5);
	pointer-events: auto;
}

.houseName {
	margin: 0;
	color: white;
	font-size: 18px;
}

.ownerBadge {
	background: var(--MI_THEME-accent);
	color: white;
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 12px;
}

.modeControls {
	display: flex;
	gap: 8px;
	padding: 12px;
	background: rgba(0, 0, 0, 0.3);
	pointer-events: auto;
}

.activeMode {
	background: var(--MI_THEME-accent) !important;
}

.furniturePanel, .wallPanel {
	position: absolute;
	right: 12px;
	top: 100px;
	width: 250px;
	background: rgba(0, 0, 0, 0.8);
	border-radius: 8px;
	padding: 12px;
	pointer-events: auto;
	color: white;

	h3 {
		margin: 0 0 12px 0;
		font-size: 14px;
	}
}

.furnitureList {
	display: flex;
	flex-direction: column;
	gap: 8px;
	max-height: 300px;
	overflow-y: auto;
}

.furnitureItem {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 4px;
	cursor: pointer;

	&:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	&.selected {
		background: var(--MI_THEME-accent);
	}

	img {
		width: 32px;
		height: 32px;
		object-fit: contain;
	}
}

.furnitureActions {
	margin-top: 12px;
}

.wallPositions {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-bottom: 12px;
}

.activeWall {
	background: var(--MI_THEME-accent) !important;
}

.wallItems {
	h4 {
		margin: 0 0 8px 0;
		font-size: 13px;
	}
}

.wallItem {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 4px;
	margin-bottom: 8px;

	img {
		width: 32px;
		height: 32px;
		object-fit: contain;
	}
}

.wallItemType {
	font-size: 10px;
	background: rgba(255, 255, 255, 0.2);
	padding: 2px 4px;
	border-radius: 2px;
}

.frameContent {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 4px;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 4px;

	img {
		width: 24px;
		height: 24px;
	}
}

.exitArea {
	position: absolute;
	bottom: 12px;
	left: 50%;
	transform: translateX(-50%);
	pointer-events: auto;
}
</style>
