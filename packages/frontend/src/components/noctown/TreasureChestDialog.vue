<script setup lang="ts">
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, computed, onMounted } from 'vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';

type ChestRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

const props = defineProps<{
	chestId: string;
	rarity: ChestRarity;
}>();

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'opened', rewards: {
		item: { id: string; name: string; quantity: number } | null;
		coins: number;
	}): void;
}>();

const isOpening = ref(false);
const isOpened = ref(false);
const rewards = ref<{
	item: { id: string; name: string; quantity: number } | null;
	coins: number;
} | null>(null);
const error = ref<string | null>(null);
const showRewardAnimation = ref(false);

// Rarity display information
const rarityInfo = computed(() => {
	const info: Record<ChestRarity, { label: string; color: string; bgColor: string }> = {
		common: { label: 'Common', color: '#8b4513', bgColor: 'rgba(139, 69, 19, 0.2)' },
		uncommon: { label: 'Uncommon', color: '#228b22', bgColor: 'rgba(34, 139, 34, 0.2)' },
		rare: { label: 'Rare', color: '#4169e1', bgColor: 'rgba(65, 105, 225, 0.2)' },
		epic: { label: 'Epic', color: '#8b008b', bgColor: 'rgba(139, 0, 139, 0.2)' },
		legendary: { label: 'Legendary', color: '#ffa500', bgColor: 'rgba(255, 165, 0, 0.2)' },
	};
	return info[props.rarity];
});

async function openChest() {
	if (isOpening.value || isOpened.value) return;

	isOpening.value = true;
	error.value = null;

	try {
		const result = await misskeyApi('noctown/chest/open', {
			chestId: props.chestId,
		});

		if (result.success && result.rewards) {
			rewards.value = result.rewards;
			isOpened.value = true;

			// Trigger reward animation
			setTimeout(() => {
				showRewardAnimation.value = true;
			}, 300);

			emit('opened', result.rewards);
		}
	} catch (err: any) {
		if (err.code === 'CHEST_ALREADY_OPENED') {
			error.value = 'This chest has already been opened';
		} else if (err.code === 'TOO_FAR_FROM_CHEST') {
			error.value = 'You are too far from the chest';
		} else if (err.code === 'CHEST_NOT_FOUND') {
			error.value = 'Chest not found';
		} else {
			error.value = 'Failed to open chest';
		}
	} finally {
		isOpening.value = false;
	}
}

function close() {
	emit('close');
}
</script>

<template>
	<MkModalWindow
		:width="400"
		:height="450"
		@close="close"
		@closed="close"
	>
		<template #header>
			<span class="header-title">Treasure Chest</span>
		</template>

		<div class="treasure-chest-dialog">
			<!-- Chest Visual -->
			<div class="chest-container" :class="{ opened: isOpened }">
				<div class="chest" :class="[rarity, { opening: isOpening }]">
					<div class="chest-lid"></div>
					<div class="chest-body"></div>
					<div class="chest-lock"></div>
				</div>
				<div v-if="isOpened" class="sparkles">
					<span v-for="i in 12" :key="i" class="sparkle" :style="{ '--delay': i * 0.1 + 's' }"></span>
				</div>
			</div>

			<!-- Rarity Badge -->
			<div class="rarity-badge" :style="{ backgroundColor: rarityInfo.bgColor, color: rarityInfo.color }">
				{{ rarityInfo.label }}
			</div>

			<!-- Rewards Display -->
			<div v-if="isOpened && rewards" class="rewards" :class="{ 'show-animation': showRewardAnimation }">
				<div class="rewards-title">Rewards</div>

				<div class="reward-list">
					<!-- Coins -->
					<div v-if="rewards.coins > 0" class="reward-item coins">
						<span class="coin-icon">$</span>
						<span class="reward-amount">+{{ rewards.coins }}</span>
						<span class="reward-label">Coins</span>
					</div>

					<!-- Item -->
					<div v-if="rewards.item" class="reward-item item">
						<span class="item-icon">?</span>
						<span class="reward-amount">x{{ rewards.item.quantity }}</span>
						<span class="reward-label">{{ rewards.item.name }}</span>
					</div>

					<!-- No Items -->
					<div v-if="!rewards.item && rewards.coins === 0" class="reward-item empty">
						<span class="reward-label">The chest was empty...</span>
					</div>
				</div>
			</div>

			<!-- Error Message -->
			<div v-if="error" class="error-message">
				{{ error }}
			</div>

			<!-- Actions -->
			<div class="actions">
				<MkButton
					v-if="!isOpened"
					primary
					:disabled="isOpening"
					@click="openChest"
				>
					<template v-if="isOpening">Opening...</template>
					<template v-else>Open Chest</template>
				</MkButton>

				<MkButton
					v-if="isOpened"
					@click="close"
				>
					Close
				</MkButton>
			</div>
		</div>
	</MkModalWindow>
</template>

<style lang="scss" scoped>
.treasure-chest-dialog {
	padding: 24px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
}

.chest-container {
	position: relative;
	width: 120px;
	height: 100px;
	margin-bottom: 8px;

	&.opened {
		.chest-lid {
			transform: rotateX(-110deg);
		}
	}
}

.chest {
	position: relative;
	width: 100%;
	height: 100%;
	transform-style: preserve-3d;
	perspective: 500px;

	&.opening {
		animation: chest-shake 0.5s ease-in-out;
	}

	// Rarity colors
	&.common {
		--chest-color: #8b4513;
		--chest-accent: #b8860b;
	}
	&.uncommon {
		--chest-color: #228b22;
		--chest-accent: #32cd32;
	}
	&.rare {
		--chest-color: #4169e1;
		--chest-accent: #1e90ff;
	}
	&.epic {
		--chest-color: #8b008b;
		--chest-accent: #da70d6;
	}
	&.legendary {
		--chest-color: #ffa500;
		--chest-accent: #ffd700;
		animation: legendary-glow 2s ease-in-out infinite;
	}
}

.chest-body {
	position: absolute;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
	width: 100px;
	height: 60px;
	background: linear-gradient(180deg, var(--chest-color) 0%, color-mix(in srgb, var(--chest-color) 70%, black) 100%);
	border-radius: 4px;
	border: 3px solid var(--chest-accent);

	&::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 70%;
		height: 4px;
		background: var(--chest-accent);
		border-radius: 2px;
	}
}

.chest-lid {
	position: absolute;
	top: 20px;
	left: 50%;
	transform: translateX(-50%);
	width: 104px;
	height: 30px;
	background: linear-gradient(180deg, color-mix(in srgb, var(--chest-color) 100%, white 20%) 0%, var(--chest-color) 100%);
	border-radius: 50% 50% 4px 4px;
	border: 3px solid var(--chest-accent);
	transform-origin: bottom center;
	transition: transform 0.5s ease-out;
}

.chest-lock {
	position: absolute;
	bottom: 45px;
	left: 50%;
	transform: translateX(-50%);
	width: 16px;
	height: 20px;
	background: var(--chest-accent);
	border-radius: 2px;
	z-index: 10;

	&::before {
		content: '';
		position: absolute;
		top: 2px;
		left: 50%;
		transform: translateX(-50%);
		width: 8px;
		height: 8px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 50%;
	}
}

.sparkles {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 100%;
	height: 100%;
	pointer-events: none;
}

.sparkle {
	position: absolute;
	width: 8px;
	height: 8px;
	background: gold;
	border-radius: 50%;
	animation: sparkle 1s ease-out forwards;
	animation-delay: var(--delay);
	opacity: 0;

	@for $i from 1 through 12 {
		&:nth-child(#{$i}) {
			--angle: #{$i * 30}deg;
			transform: rotate(var(--angle)) translateY(-40px);
		}
	}
}

.rarity-badge {
	padding: 4px 12px;
	border-radius: 12px;
	font-size: 12px;
	font-weight: bold;
	text-transform: uppercase;
	letter-spacing: 1px;
}

.rewards {
	width: 100%;
	opacity: 0;
	transform: translateY(20px);
	transition: opacity 0.3s ease, transform 0.3s ease;

	&.show-animation {
		opacity: 1;
		transform: translateY(0);
	}
}

.rewards-title {
	text-align: center;
	font-size: 18px;
	font-weight: bold;
	margin-bottom: 12px;
	color: var(--accent);
}

.reward-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.reward-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	background: var(--panel);
	border-radius: 8px;

	&.coins {
		.coin-icon {
			width: 32px;
			height: 32px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: linear-gradient(135deg, #ffd700, #ffaa00);
			color: white;
			font-weight: bold;
			font-size: 18px;
			border-radius: 50%;
		}
	}

	&.item {
		.item-icon {
			width: 32px;
			height: 32px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: var(--accentedBg);
			color: var(--accent);
			font-weight: bold;
			font-size: 18px;
			border-radius: 4px;
		}
	}

	&.empty {
		justify-content: center;
		font-style: italic;
		opacity: 0.7;
	}
}

.reward-amount {
	font-size: 16px;
	font-weight: bold;
	color: var(--accent);
}

.reward-label {
	flex: 1;
	font-size: 14px;
}

.error-message {
	padding: 12px;
	background: rgba(255, 0, 0, 0.1);
	color: #ff4444;
	border-radius: 8px;
	text-align: center;
	width: 100%;
}

.actions {
	margin-top: auto;
	padding-top: 16px;
	display: flex;
	justify-content: center;
	width: 100%;
}

@keyframes chest-shake {
	0%, 100% { transform: translateX(0) rotate(0); }
	20% { transform: translateX(-3px) rotate(-2deg); }
	40% { transform: translateX(3px) rotate(2deg); }
	60% { transform: translateX(-3px) rotate(-2deg); }
	80% { transform: translateX(3px) rotate(2deg); }
}

@keyframes legendary-glow {
	0%, 100% { filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5)); }
	50% { filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.8)); }
}

@keyframes sparkle {
	0% {
		opacity: 0;
		transform: rotate(var(--angle)) translateY(0);
	}
	20% {
		opacity: 1;
	}
	100% {
		opacity: 0;
		transform: rotate(var(--angle)) translateY(-60px);
	}
}
</style>
