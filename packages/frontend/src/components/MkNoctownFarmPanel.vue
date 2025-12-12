<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="500"
	:height="600"
	@close="close()"
	@closed="emit('closed')"
>
	<template #header>
		<i class="ti ti-plant"></i> {{ i18n.ts._noctown.farm }}
	</template>

	<div class="_gaps_m" style="padding: 16px;">
		<!-- Farm Plots Section -->
		<div class="section">
			<div class="section-header">
				<span>{{ i18n.ts._noctown.farmPlots }}</span>
				<MkButton small @click="createPlot">
					<i class="ti ti-plus"></i>
				</MkButton>
			</div>

			<div v-if="farmPlots.length === 0" class="empty">
				{{ i18n.ts._noctown.noFarmPlots }}
			</div>

			<div v-for="plot in farmPlots" :key="plot.id" class="plot-item">
				<div class="plot-info">
					<span class="plot-position">
						({{ Math.floor(plot.positionX) }}, {{ Math.floor(plot.positionZ) }})
					</span>
					<span v-if="plot.crop" class="crop-stage">
						{{ getCropStageLabel(plot.crop.stage) }}
						<span class="progress">({{ plot.crop.growthProgress }}%)</span>
					</span>
					<span v-else class="empty-plot">
						{{ i18n.ts._noctown.emptyPlot }}
					</span>
				</div>

				<div class="plot-actions">
					<template v-if="plot.crop">
						<MkButton v-if="plot.crop.stage !== 'harvestable'" small @click="waterCrop(plot.crop.id)">
							<i class="ti ti-droplet"></i>
						</MkButton>
						<MkButton v-if="plot.crop.stage === 'harvestable'" small primary @click="harvestCrop(plot.crop.id)">
							<i class="ti ti-basket"></i>
						</MkButton>
					</template>
					<MkButton v-else small @click="openPlantModal(plot.id)">
						<i class="ti ti-seed"></i>
					</MkButton>
				</div>
			</div>
		</div>

		<!-- Chickens Section -->
		<div class="section">
			<div class="section-header">
				<span>{{ i18n.ts._noctown.chickens }}</span>
				<MkButton small @click="placeChicken">
					<i class="ti ti-plus"></i>
				</MkButton>
			</div>

			<div v-if="chickens.length === 0" class="empty">
				{{ i18n.ts._noctown.noChickens }}
			</div>

			<div v-for="chicken in chickens" :key="chicken.id" class="animal-item">
				<div class="animal-info">
					<span class="animal-name">{{ chicken.name || i18n.ts._noctown.unnamed }}</span>
					<div class="stats">
						<span class="stat">
							<i class="ti ti-meat"></i> {{ chicken.hunger }}%
						</span>
						<span class="stat">
							<i class="ti ti-heart"></i> {{ chicken.happiness }}%
						</span>
						<span v-if="chicken.eggsReady > 0" class="stat eggs">
							<i class="ti ti-egg"></i> {{ chicken.eggsReady }}
						</span>
					</div>
				</div>

				<div class="animal-actions">
					<MkButton small @click="feedChicken(chicken.id)">
						<i class="ti ti-meat"></i>
					</MkButton>
					<MkButton v-if="chicken.eggsReady > 0" small primary @click="collectEggs(chicken.id)">
						<i class="ti ti-egg"></i>
					</MkButton>
				</div>
			</div>
		</div>

		<!-- Cows Section -->
		<div class="section">
			<div class="section-header">
				<span>{{ i18n.ts._noctown.cows }}</span>
				<MkButton small @click="placeCow">
					<i class="ti ti-plus"></i>
				</MkButton>
			</div>

			<div v-if="cows.length === 0" class="empty">
				{{ i18n.ts._noctown.noCows }}
			</div>

			<div v-for="cow in cows" :key="cow.id" class="animal-item">
				<div class="animal-info">
					<span class="animal-name">{{ cow.name || i18n.ts._noctown.unnamed }}</span>
					<div class="stats">
						<span class="stat">
							<i class="ti ti-meat"></i> {{ cow.hunger }}%
						</span>
						<span class="stat">
							<i class="ti ti-heart"></i> {{ cow.happiness }}%
						</span>
						<span v-if="cow.milkReady > 0" class="stat milk">
							<i class="ti ti-milk"></i> {{ cow.milkReady }}
						</span>
					</div>
				</div>

				<div class="animal-actions">
					<MkButton small @click="feedCow(cow.id)">
						<i class="ti ti-meat"></i>
					</MkButton>
					<MkButton v-if="cow.milkReady > 0" small primary @click="collectMilk(cow.id)">
						<i class="ti ti-milk"></i>
					</MkButton>
				</div>
			</div>
		</div>
	</div>

	<!-- Plant Modal -->
	<MkModal v-if="showPlantModal" @close="showPlantModal = false" @closed="selectedPlotId = null">
		<div class="plant-modal">
			<div class="modal-header">{{ i18n.ts._noctown.selectSeed }}</div>
			<div class="seed-list">
				<div
					v-for="item in seedItems"
					:key="item.id"
					class="seed-item"
					@click="plantSeed(item.id)"
				>
					<span class="seed-name">{{ item.itemName }}</span>
					<span class="seed-quantity">x{{ item.quantity }}</span>
				</div>
				<div v-if="seedItems.length === 0" class="no-seeds">
					{{ i18n.ts._noctown.noSeeds }}
				</div>
			</div>
		</div>
	</MkModal>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import * as os from '@/os.js';

interface FarmPlot {
	id: string;
	positionX: number;
	positionY: number;
	positionZ: number;
	size: number;
	crop: {
		id: string;
		stage: string;
		waterLevel: number;
		growthProgress: number;
	} | null;
}

interface Chicken {
	id: string;
	name: string | null;
	positionX: number;
	positionY: number;
	positionZ: number;
	hunger: number;
	happiness: number;
	eggsReady: number;
}

interface Cow {
	id: string;
	name: string | null;
	positionX: number;
	positionY: number;
	positionZ: number;
	hunger: number;
	happiness: number;
	milkReady: number;
}

interface InventoryItem {
	id: string;
	itemId: string;
	itemName: string;
	itemType: string;
	quantity: number;
	acquiredAt: string;
}

const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'farmUpdated'): void;
}>();

const props = defineProps<{
	playerX: number;
	playerZ: number;
}>();

const dialog = ref<InstanceType<typeof MkModalWindow> | null>(null);
const farmPlots = ref<FarmPlot[]>([]);
const chickens = ref<Chicken[]>([]);
const cows = ref<Cow[]>([]);
const seedItems = ref<InventoryItem[]>([]);
const showPlantModal = ref(false);
const selectedPlotId = ref<string | null>(null);

function close() {
	dialog.value?.close();
}

function getCropStageLabel(stage: string): string {
	const stageLabels: Record<string, string> = {
		seed: i18n.ts._noctown.cropStageSeed,
		sprout: i18n.ts._noctown.cropStageSprout,
		growing: i18n.ts._noctown.cropStageGrowing,
		mature: i18n.ts._noctown.cropStageMature,
		harvestable: i18n.ts._noctown.cropStageHarvestable,
		withered: i18n.ts._noctown.cropStageWithered,
	};
	return stageLabels[stage] || stage;
}

async function loadFarmData() {
	try {
		const [plotsRes, chickensRes, cowsRes, inventoryRes] = await Promise.all([
			misskeyApi('noctown/farm/list', {}),
			misskeyApi('noctown/chicken/list', {}),
			misskeyApi('noctown/cow/list', {}),
			misskeyApi('noctown/item/inventory', {}),
		]);

		farmPlots.value = plotsRes;
		chickens.value = chickensRes;
		cows.value = cowsRes;

		// Filter for seed items
		seedItems.value = inventoryRes.filter((item: InventoryItem) =>
			item.itemName.includes('seed') || item.itemName.includes('Seed') ||
			item.itemName.includes('種') || item.itemType === 'seed'
		);
	} catch (err) {
		console.error('Failed to load farm data:', err);
	}
}

async function createPlot() {
	try {
		await misskeyApi('noctown/farm/create', {
			x: props.playerX,
			y: 0,
			z: props.playerZ,
		});
		await loadFarmData();
		emit('farmUpdated');
		os.toast(i18n.ts._noctown.farmPlotCreated);
	} catch (err: unknown) {
		if (err && typeof err === 'object' && 'code' in err) {
			const error = err as { code: string };
			if (error.code === 'MAX_PLOTS_REACHED') {
				os.alert({ type: 'error', text: i18n.ts._noctown.maxPlotsReached });
			} else if (error.code === 'LOCATION_OCCUPIED') {
				os.alert({ type: 'error', text: i18n.ts._noctown.locationOccupied });
			}
		}
	}
}

function openPlantModal(plotId: string) {
	selectedPlotId.value = plotId;
	showPlantModal.value = true;
}

async function plantSeed(seedItemId: string) {
	if (!selectedPlotId.value) return;

	try {
		await misskeyApi('noctown/farm/plant', {
			plotId: selectedPlotId.value,
			seedItemId,
		});
		showPlantModal.value = false;
		await loadFarmData();
		emit('farmUpdated');
		os.toast(i18n.ts._noctown.seedPlanted);
	} catch (err) {
		console.error('Failed to plant seed:', err);
	}
}

async function waterCrop(cropId: string) {
	try {
		await misskeyApi('noctown/farm/water', { cropId });
		await loadFarmData();
		os.toast(i18n.ts._noctown.cropWatered);
	} catch (err) {
		console.error('Failed to water crop:', err);
	}
}

async function harvestCrop(cropId: string) {
	try {
		const result = await misskeyApi('noctown/farm/harvest', { cropId });
		await loadFarmData();
		emit('farmUpdated');
		os.toast(i18n.ts._noctown.cropHarvested + ` (x${result.quantity})`);
	} catch (err) {
		console.error('Failed to harvest crop:', err);
	}
}

async function placeChicken() {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts._noctown.nameChicken,
		placeholder: i18n.ts._noctown.optional,
	});
	if (canceled) return;

	try {
		await misskeyApi('noctown/chicken/place', {
			x: props.playerX,
			y: 0,
			z: props.playerZ,
			name: name || undefined,
		});
		await loadFarmData();
		emit('farmUpdated');
		os.toast(i18n.ts._noctown.chickenPlaced);
	} catch (err: unknown) {
		if (err && typeof err === 'object' && 'code' in err) {
			const error = err as { code: string };
			if (error.code === 'MAX_CHICKENS_REACHED') {
				os.alert({ type: 'error', text: i18n.ts._noctown.maxChickensReached });
			}
		}
	}
}

async function feedChicken(chickenId: string) {
	// For now, use a simple approach - could show feed selection modal
	try {
		// Try to use first available feed item
		const feedItems = seedItems.value; // Using seeds as generic feed for now
		if (feedItems.length === 0) {
			os.alert({ type: 'warning', text: i18n.ts._noctown.noFeedItems });
			return;
		}

		await misskeyApi('noctown/chicken/feed', {
			chickenId,
			feedItemId: feedItems[0].id,
		});
		await loadFarmData();
		os.toast(i18n.ts._noctown.chickenFed);
	} catch (err) {
		console.error('Failed to feed chicken:', err);
	}
}

async function collectEggs(chickenId: string) {
	try {
		const result = await misskeyApi('noctown/chicken/collect-eggs', { chickenId });
		await loadFarmData();
		os.toast(i18n.ts._noctown.eggsCollected + ` (x${result.quantity})`);
	} catch (err) {
		console.error('Failed to collect eggs:', err);
	}
}

async function placeCow() {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts._noctown.nameCow,
		placeholder: i18n.ts._noctown.optional,
	});
	if (canceled) return;

	try {
		await misskeyApi('noctown/cow/place', {
			x: props.playerX,
			y: 0,
			z: props.playerZ,
			name: name || undefined,
		});
		await loadFarmData();
		emit('farmUpdated');
		os.toast(i18n.ts._noctown.cowPlaced);
	} catch (err: unknown) {
		if (err && typeof err === 'object' && 'code' in err) {
			const error = err as { code: string };
			if (error.code === 'MAX_COWS_REACHED') {
				os.alert({ type: 'error', text: i18n.ts._noctown.maxCowsReached });
			}
		}
	}
}

async function feedCow(cowId: string) {
	try {
		const feedItems = seedItems.value;
		if (feedItems.length === 0) {
			os.alert({ type: 'warning', text: i18n.ts._noctown.noFeedItems });
			return;
		}

		await misskeyApi('noctown/cow/feed', {
			cowId,
			feedItemId: feedItems[0].id,
		});
		await loadFarmData();
		os.toast(i18n.ts._noctown.cowFed);
	} catch (err) {
		console.error('Failed to feed cow:', err);
	}
}

async function collectMilk(cowId: string) {
	try {
		const result = await misskeyApi('noctown/cow/collect-milk', { cowId });
		await loadFarmData();
		os.toast(i18n.ts._noctown.milkCollected + ` (x${result.quantity})`);
	} catch (err) {
		console.error('Failed to collect milk:', err);
	}
}

onMounted(() => {
	loadFarmData();
});
</script>

<style lang="scss" scoped>
.section {
	border: 1px solid var(--divider);
	border-radius: 8px;
	padding: 12px;

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		font-weight: bold;
	}

	.empty {
		color: var(--fgTransparent);
		text-align: center;
		padding: 16px;
	}
}

.plot-item, .animal-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px;
	border-radius: 6px;
	background: var(--panel);
	margin-bottom: 8px;

	&:last-child {
		margin-bottom: 0;
	}
}

.plot-info, .animal-info {
	flex: 1;
}

.plot-position {
	font-family: monospace;
	font-size: 0.9em;
	margin-right: 8px;
}

.crop-stage {
	color: var(--accent);

	.progress {
		color: var(--fgTransparent);
		font-size: 0.85em;
	}
}

.empty-plot {
	color: var(--fgTransparent);
}

.animal-name {
	font-weight: bold;
	display: block;
	margin-bottom: 4px;
}

.stats {
	display: flex;
	gap: 12px;
	font-size: 0.85em;

	.stat {
		display: flex;
		align-items: center;
		gap: 4px;

		&.eggs {
			color: #f0ad4e;
		}

		&.milk {
			color: #5bc0de;
		}
	}
}

.plot-actions, .animal-actions {
	display: flex;
	gap: 4px;
}

.plant-modal {
	background: var(--panel);
	border-radius: 8px;
	padding: 16px;
	width: 300px;

	.modal-header {
		font-weight: bold;
		margin-bottom: 12px;
	}

	.seed-list {
		max-height: 200px;
		overflow-y: auto;
	}

	.seed-item {
		display: flex;
		justify-content: space-between;
		padding: 8px;
		border-radius: 4px;
		cursor: pointer;

		&:hover {
			background: var(--buttonHoverBg);
		}
	}

	.no-seeds {
		color: var(--fgTransparent);
		text-align: center;
		padding: 16px;
	}
}
</style>
