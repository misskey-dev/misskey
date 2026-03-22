<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.container">
	<div :class="$style.header">
		<h3 :class="$style.title">
			<i class="ti ti-mood-smile"></i>
			絵文字
		</h3>
		<button :class="$style.closeBtn" @click="$emit('close')">
			<i class="ti ti-x"></i>
		</button>
	</div>

	<!-- Category tabs -->
	<div :class="$style.tabs">
		<button
			v-for="cat in categories"
			:key="cat.id"
			:class="[$style.tab, selectedCategory === cat.id && $style.activeTab]"
			@click="selectedCategory = cat.id"
		>
			{{ cat.icon }}
		</button>
	</div>

	<!-- Emoji grid -->
	<div :class="$style.emojiGrid">
		<button
			v-for="emoji in filteredEmojis"
			:key="emoji.emoji"
			:class="$style.emojiBtn"
			@click="selectEmoji(emoji)"
		>
			<template v-if="emoji.isCustom">
				<img :src="emoji.url" :alt="emoji.name" :class="$style.customEmoji" />
			</template>
			<template v-else>
				{{ emoji.emoji }}
			</template>
		</button>
	</div>

	<!-- Recent emojis -->
	<div v-if="recentEmojis.length > 0" :class="$style.recent">
		<span :class="$style.recentLabel">最近使用</span>
		<div :class="$style.recentGrid">
			<button
				v-for="emoji in recentEmojis"
				:key="emoji.emoji"
				:class="$style.emojiBtn"
				@click="selectEmoji(emoji)"
			>
				<template v-if="emoji.isCustom">
					<img :src="emoji.url" :alt="emoji.name" :class="$style.customEmoji" />
				</template>
				<template v-else>
					{{ emoji.emoji }}
				</template>
			</button>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';

interface EmojiData {
	emoji: string;
	name: string;
	category: string;
	isCustom: boolean;
	url?: string;
}

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'select', emoji: string, isCustom: boolean, url?: string): void;
}>();

const categories = [
	{ id: 'recent', icon: '🕐' },
	{ id: 'smileys', icon: '😀' },
	{ id: 'people', icon: '👋' },
	{ id: 'nature', icon: '🌸' },
	{ id: 'food', icon: '🍎' },
	{ id: 'activities', icon: '⚽' },
	{ id: 'objects', icon: '💡' },
	{ id: 'symbols', icon: '❤️' },
	{ id: 'custom', icon: '⭐' },
];

const selectedCategory = ref('smileys');
const recentEmojis = ref<EmojiData[]>([]);
const customEmojis = ref<EmojiData[]>([]);

// Standard emoji sets
const standardEmojis: EmojiData[] = [
	// Smileys
	{ emoji: '😀', name: 'grinning', category: 'smileys', isCustom: false },
	{ emoji: '😃', name: 'smiley', category: 'smileys', isCustom: false },
	{ emoji: '😄', name: 'smile', category: 'smileys', isCustom: false },
	{ emoji: '😁', name: 'grin', category: 'smileys', isCustom: false },
	{ emoji: '😆', name: 'laughing', category: 'smileys', isCustom: false },
	{ emoji: '😅', name: 'sweat_smile', category: 'smileys', isCustom: false },
	{ emoji: '🤣', name: 'rofl', category: 'smileys', isCustom: false },
	{ emoji: '😂', name: 'joy', category: 'smileys', isCustom: false },
	{ emoji: '🙂', name: 'slightly_smiling', category: 'smileys', isCustom: false },
	{ emoji: '😊', name: 'blush', category: 'smileys', isCustom: false },
	{ emoji: '😇', name: 'innocent', category: 'smileys', isCustom: false },
	{ emoji: '🥰', name: 'smiling_hearts', category: 'smileys', isCustom: false },
	{ emoji: '😍', name: 'heart_eyes', category: 'smileys', isCustom: false },
	{ emoji: '🤩', name: 'star_struck', category: 'smileys', isCustom: false },
	{ emoji: '😘', name: 'kissing_heart', category: 'smileys', isCustom: false },
	{ emoji: '😗', name: 'kissing', category: 'smileys', isCustom: false },
	{ emoji: '😚', name: 'kissing_closed_eyes', category: 'smileys', isCustom: false },
	{ emoji: '😋', name: 'yum', category: 'smileys', isCustom: false },
	{ emoji: '😛', name: 'stuck_out_tongue', category: 'smileys', isCustom: false },
	{ emoji: '😜', name: 'stuck_out_tongue_winking', category: 'smileys', isCustom: false },
	{ emoji: '🤪', name: 'zany', category: 'smileys', isCustom: false },
	{ emoji: '😝', name: 'stuck_out_tongue_closed_eyes', category: 'smileys', isCustom: false },
	{ emoji: '🤑', name: 'money_mouth', category: 'smileys', isCustom: false },
	{ emoji: '🤗', name: 'hugging', category: 'smileys', isCustom: false },
	{ emoji: '🤭', name: 'hand_over_mouth', category: 'smileys', isCustom: false },
	{ emoji: '🤔', name: 'thinking', category: 'smileys', isCustom: false },
	{ emoji: '🤐', name: 'zipper_mouth', category: 'smileys', isCustom: false },
	{ emoji: '😐', name: 'neutral', category: 'smileys', isCustom: false },
	{ emoji: '😑', name: 'expressionless', category: 'smileys', isCustom: false },
	{ emoji: '😶', name: 'no_mouth', category: 'smileys', isCustom: false },
	{ emoji: '😏', name: 'smirk', category: 'smileys', isCustom: false },
	{ emoji: '😒', name: 'unamused', category: 'smileys', isCustom: false },
	{ emoji: '🙄', name: 'roll_eyes', category: 'smileys', isCustom: false },
	{ emoji: '😬', name: 'grimacing', category: 'smileys', isCustom: false },
	{ emoji: '😮‍💨', name: 'exhaling', category: 'smileys', isCustom: false },
	{ emoji: '🤥', name: 'lying', category: 'smileys', isCustom: false },
	{ emoji: '😌', name: 'relieved', category: 'smileys', isCustom: false },
	{ emoji: '😔', name: 'pensive', category: 'smileys', isCustom: false },
	{ emoji: '😪', name: 'sleepy', category: 'smileys', isCustom: false },
	{ emoji: '🤤', name: 'drooling', category: 'smileys', isCustom: false },
	{ emoji: '😴', name: 'sleeping', category: 'smileys', isCustom: false },
	{ emoji: '😷', name: 'mask', category: 'smileys', isCustom: false },
	{ emoji: '🤒', name: 'thermometer', category: 'smileys', isCustom: false },
	{ emoji: '🤕', name: 'bandage', category: 'smileys', isCustom: false },
	{ emoji: '🤢', name: 'nauseated', category: 'smileys', isCustom: false },
	{ emoji: '🤮', name: 'vomiting', category: 'smileys', isCustom: false },
	{ emoji: '🥵', name: 'hot', category: 'smileys', isCustom: false },
	{ emoji: '🥶', name: 'cold', category: 'smileys', isCustom: false },
	{ emoji: '😵', name: 'dizzy', category: 'smileys', isCustom: false },
	{ emoji: '🤯', name: 'exploding_head', category: 'smileys', isCustom: false },

	// People
	{ emoji: '👋', name: 'wave', category: 'people', isCustom: false },
	{ emoji: '🤚', name: 'raised_back_of_hand', category: 'people', isCustom: false },
	{ emoji: '✋', name: 'hand', category: 'people', isCustom: false },
	{ emoji: '🖖', name: 'vulcan', category: 'people', isCustom: false },
	{ emoji: '👌', name: 'ok_hand', category: 'people', isCustom: false },
	{ emoji: '🤌', name: 'pinched_fingers', category: 'people', isCustom: false },
	{ emoji: '✌️', name: 'v', category: 'people', isCustom: false },
	{ emoji: '🤞', name: 'crossed_fingers', category: 'people', isCustom: false },
	{ emoji: '🤟', name: 'love_you', category: 'people', isCustom: false },
	{ emoji: '🤘', name: 'metal', category: 'people', isCustom: false },
	{ emoji: '🤙', name: 'call_me', category: 'people', isCustom: false },
	{ emoji: '👈', name: 'point_left', category: 'people', isCustom: false },
	{ emoji: '👉', name: 'point_right', category: 'people', isCustom: false },
	{ emoji: '👆', name: 'point_up', category: 'people', isCustom: false },
	{ emoji: '👇', name: 'point_down', category: 'people', isCustom: false },
	{ emoji: '👍', name: 'thumbsup', category: 'people', isCustom: false },
	{ emoji: '👎', name: 'thumbsdown', category: 'people', isCustom: false },
	{ emoji: '✊', name: 'fist', category: 'people', isCustom: false },
	{ emoji: '👊', name: 'punch', category: 'people', isCustom: false },
	{ emoji: '🤛', name: 'left_fist', category: 'people', isCustom: false },
	{ emoji: '🤜', name: 'right_fist', category: 'people', isCustom: false },
	{ emoji: '👏', name: 'clap', category: 'people', isCustom: false },
	{ emoji: '🙌', name: 'raised_hands', category: 'people', isCustom: false },
	{ emoji: '🤝', name: 'handshake', category: 'people', isCustom: false },
	{ emoji: '🙏', name: 'pray', category: 'people', isCustom: false },

	// Nature
	{ emoji: '🌸', name: 'cherry_blossom', category: 'nature', isCustom: false },
	{ emoji: '🌹', name: 'rose', category: 'nature', isCustom: false },
	{ emoji: '🌻', name: 'sunflower', category: 'nature', isCustom: false },
	{ emoji: '🌺', name: 'hibiscus', category: 'nature', isCustom: false },
	{ emoji: '🌷', name: 'tulip', category: 'nature', isCustom: false },
	{ emoji: '🌱', name: 'seedling', category: 'nature', isCustom: false },
	{ emoji: '🌲', name: 'evergreen', category: 'nature', isCustom: false },
	{ emoji: '🌳', name: 'tree', category: 'nature', isCustom: false },
	{ emoji: '🍀', name: 'four_leaf_clover', category: 'nature', isCustom: false },
	{ emoji: '🌈', name: 'rainbow', category: 'nature', isCustom: false },
	{ emoji: '☀️', name: 'sun', category: 'nature', isCustom: false },
	{ emoji: '🌙', name: 'moon', category: 'nature', isCustom: false },
	{ emoji: '⭐', name: 'star', category: 'nature', isCustom: false },
	{ emoji: '🌟', name: 'glowing_star', category: 'nature', isCustom: false },
	{ emoji: '✨', name: 'sparkles', category: 'nature', isCustom: false },
	{ emoji: '💫', name: 'dizzy_star', category: 'nature', isCustom: false },

	// Food
	{ emoji: '🍎', name: 'apple', category: 'food', isCustom: false },
	{ emoji: '🍊', name: 'orange', category: 'food', isCustom: false },
	{ emoji: '🍋', name: 'lemon', category: 'food', isCustom: false },
	{ emoji: '🍇', name: 'grapes', category: 'food', isCustom: false },
	{ emoji: '🍓', name: 'strawberry', category: 'food', isCustom: false },
	{ emoji: '🍰', name: 'cake', category: 'food', isCustom: false },
	{ emoji: '🍩', name: 'doughnut', category: 'food', isCustom: false },
	{ emoji: '🍪', name: 'cookie', category: 'food', isCustom: false },
	{ emoji: '🍕', name: 'pizza', category: 'food', isCustom: false },
	{ emoji: '🍔', name: 'burger', category: 'food', isCustom: false },
	{ emoji: '🍟', name: 'fries', category: 'food', isCustom: false },
	{ emoji: '🍣', name: 'sushi', category: 'food', isCustom: false },
	{ emoji: '🍜', name: 'noodles', category: 'food', isCustom: false },
	{ emoji: '🍵', name: 'tea', category: 'food', isCustom: false },
	{ emoji: '☕', name: 'coffee', category: 'food', isCustom: false },
	{ emoji: '🧃', name: 'juice_box', category: 'food', isCustom: false },

	// Activities
	{ emoji: '⚽', name: 'soccer', category: 'activities', isCustom: false },
	{ emoji: '🏀', name: 'basketball', category: 'activities', isCustom: false },
	{ emoji: '🎮', name: 'game', category: 'activities', isCustom: false },
	{ emoji: '🎯', name: 'target', category: 'activities', isCustom: false },
	{ emoji: '🎪', name: 'circus', category: 'activities', isCustom: false },
	{ emoji: '🎭', name: 'theater', category: 'activities', isCustom: false },
	{ emoji: '🎨', name: 'art', category: 'activities', isCustom: false },
	{ emoji: '🎬', name: 'movie', category: 'activities', isCustom: false },
	{ emoji: '🎤', name: 'microphone', category: 'activities', isCustom: false },
	{ emoji: '🎧', name: 'headphones', category: 'activities', isCustom: false },
	{ emoji: '🎵', name: 'music', category: 'activities', isCustom: false },
	{ emoji: '🎶', name: 'notes', category: 'activities', isCustom: false },

	// Objects
	{ emoji: '💡', name: 'bulb', category: 'objects', isCustom: false },
	{ emoji: '💎', name: 'gem', category: 'objects', isCustom: false },
	{ emoji: '🔔', name: 'bell', category: 'objects', isCustom: false },
	{ emoji: '📦', name: 'package', category: 'objects', isCustom: false },
	{ emoji: '🎁', name: 'gift', category: 'objects', isCustom: false },
	{ emoji: '🏆', name: 'trophy', category: 'objects', isCustom: false },
	{ emoji: '🎖️', name: 'medal', category: 'objects', isCustom: false },
	{ emoji: '🔑', name: 'key', category: 'objects', isCustom: false },
	{ emoji: '🗝️', name: 'old_key', category: 'objects', isCustom: false },
	{ emoji: '💰', name: 'money_bag', category: 'objects', isCustom: false },
	{ emoji: '💵', name: 'dollar', category: 'objects', isCustom: false },
	{ emoji: '💴', name: 'yen', category: 'objects', isCustom: false },

	// Symbols
	{ emoji: '❤️', name: 'heart', category: 'symbols', isCustom: false },
	{ emoji: '🧡', name: 'orange_heart', category: 'symbols', isCustom: false },
	{ emoji: '💛', name: 'yellow_heart', category: 'symbols', isCustom: false },
	{ emoji: '💚', name: 'green_heart', category: 'symbols', isCustom: false },
	{ emoji: '💙', name: 'blue_heart', category: 'symbols', isCustom: false },
	{ emoji: '💜', name: 'purple_heart', category: 'symbols', isCustom: false },
	{ emoji: '🖤', name: 'black_heart', category: 'symbols', isCustom: false },
	{ emoji: '💕', name: 'two_hearts', category: 'symbols', isCustom: false },
	{ emoji: '💖', name: 'sparkling_heart', category: 'symbols', isCustom: false },
	{ emoji: '💗', name: 'growing_heart', category: 'symbols', isCustom: false },
	{ emoji: '💘', name: 'cupid', category: 'symbols', isCustom: false },
	{ emoji: '💝', name: 'gift_heart', category: 'symbols', isCustom: false },
	{ emoji: '💯', name: '100', category: 'symbols', isCustom: false },
	{ emoji: '💢', name: 'anger', category: 'symbols', isCustom: false },
	{ emoji: '💥', name: 'boom', category: 'symbols', isCustom: false },
	{ emoji: '💫', name: 'dizzy', category: 'symbols', isCustom: false },
	{ emoji: '💬', name: 'speech', category: 'symbols', isCustom: false },
	{ emoji: '💭', name: 'thought', category: 'symbols', isCustom: false },
	{ emoji: '🔥', name: 'fire', category: 'symbols', isCustom: false },
	{ emoji: '⚡', name: 'lightning', category: 'symbols', isCustom: false },
	{ emoji: '❓', name: 'question', category: 'symbols', isCustom: false },
	{ emoji: '❗', name: 'exclamation', category: 'symbols', isCustom: false },
	{ emoji: '✅', name: 'check', category: 'symbols', isCustom: false },
	{ emoji: '❌', name: 'x', category: 'symbols', isCustom: false },
];

const filteredEmojis = computed(() => {
	if (selectedCategory.value === 'recent') {
		return recentEmojis.value;
	}
	if (selectedCategory.value === 'custom') {
		return customEmojis.value;
	}
	return standardEmojis.filter(e => e.category === selectedCategory.value);
});

function selectEmoji(emoji: EmojiData): void {
	// Add to recent
	const existingIndex = recentEmojis.value.findIndex(e => e.emoji === emoji.emoji);
	if (existingIndex !== -1) {
		recentEmojis.value.splice(existingIndex, 1);
	}
	recentEmojis.value.unshift(emoji);
	if (recentEmojis.value.length > 20) {
		recentEmojis.value.pop();
	}

	// Save to localStorage
	localStorage.setItem('noctown-recent-emojis', JSON.stringify(recentEmojis.value));

	// Emit selection with URL for custom emojis
	emit('select', emoji.emoji, emoji.isCustom, emoji.url);
	emit('close');
}

async function loadCustomEmojis(): Promise<void> {
	try {
		const res = await window.fetch('/api/emojis', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
		});

		if (res.ok) {
			const data = await res.json();
			customEmojis.value = (data.emojis ?? []).map((e: { name: string; url: string }) => ({
				emoji: `:${e.name}:`,
				name: e.name,
				category: 'custom',
				isCustom: true,
				url: e.url,
			}));
		}
	} catch (e) {
		console.error('Failed to load custom emojis:', e);
	}
}

function loadRecentEmojis(): void {
	try {
		const saved = localStorage.getItem('noctown-recent-emojis');
		if (saved) {
			recentEmojis.value = JSON.parse(saved);
		}
	} catch {
		// Ignore parse errors
	}
}

onMounted(() => {
	loadRecentEmojis();
	loadCustomEmojis();
});
</script>

<style lang="scss" module>
.container {
	width: 320px;
	background: var(--MI_THEME-panel);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 12px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	overflow: hidden;
}

.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 12px;
	border-bottom: 1px solid var(--MI_THEME-divider);
}

.title {
	margin: 0;
	font-size: 14px;
	display: flex;
	align-items: center;
	gap: 6px;
}

.closeBtn {
	background: none;
	border: none;
	padding: 4px;
	cursor: pointer;
	color: var(--MI_THEME-fg);
	opacity: 0.6;

	&:hover {
		opacity: 1;
	}
}

.tabs {
	display: flex;
	padding: 4px;
	border-bottom: 1px solid var(--MI_THEME-divider);
	overflow-x: auto;
}

.tab {
	flex-shrink: 0;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: none;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	font-size: 18px;
	transition: background 0.15s;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.activeTab {
	background: var(--MI_THEME-accent);
}

.emojiGrid {
	display: grid;
	grid-template-columns: repeat(8, 1fr);
	gap: 2px;
	padding: 8px;
	max-height: 200px;
	overflow-y: auto;
}

.emojiBtn {
	width: 36px;
	height: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: none;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	font-size: 22px;
	transition: background 0.15s;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.customEmoji {
	width: 24px;
	height: 24px;
	object-fit: contain;
}

.recent {
	padding: 8px;
	border-top: 1px solid var(--MI_THEME-divider);
}

.recentLabel {
	display: block;
	font-size: 11px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
	margin-bottom: 6px;
}

.recentGrid {
	display: flex;
	gap: 4px;
	overflow-x: auto;
}
</style>
