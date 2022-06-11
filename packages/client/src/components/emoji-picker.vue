<template>
<div class="omfetrab" :class="['s' + size, 'w' + width, 'h' + height, { asDrawer }]" :style="{ maxHeight: maxHeight ? maxHeight + 'px' : undefined }">
	<input ref="search" v-model.trim="q" class="search" data-prevent-emoji-insert :class="{ filled: q != null && q != '' }" :placeholder="i18n.ts.search" type="search" @paste.stop="paste" @keyup.enter="done()">
	<div ref="emojis" class="emojis">
		<section class="result">
			<div v-if="searchResultCustom.length > 0">
				<button v-for="emoji in searchResultCustom"
					:key="emoji.id"
					class="_button"
					:title="emoji.name"
					tabindex="0"
					@click="chosen(emoji, $event)"
				>
					<!--<MkEmoji v-if="emoji.char != null" :emoji="emoji.char"/>-->
					<img :src="disableShowingAnimatedImages ? getStaticImageUrl(emoji.url) : emoji.url"/>
				</button>
			</div>
			<div v-if="searchResultUnicode.length > 0">
				<button v-for="emoji in searchResultUnicode"
					:key="emoji.name"
					class="_button"
					:title="emoji.name"
					tabindex="0"
					@click="chosen(emoji, $event)"
				>
					<MkEmoji :emoji="emoji.char"/>
				</button>
			</div>
		</section>

		<div v-if="tab === 'index'" class="index">
			<section v-if="showPinned">
				<div>
					<button v-for="emoji in pinned"
						:key="emoji"
						class="_button"
						tabindex="0"
						@click="chosen(emoji, $event)"
					>
						<MkEmoji :emoji="emoji" :normal="true"/>
					</button>
				</div>
			</section>

			<section>
				<header class="_acrylic"><i class="far fa-clock fa-fw"></i> {{ i18n.ts.recentUsed }}</header>
				<div>
					<button v-for="emoji in recentlyUsedEmojis"
						:key="emoji"
						class="_button"
						@click="chosen(emoji, $event)"
					>
						<MkEmoji :emoji="emoji" :normal="true"/>
					</button>
				</div>
			</section>
		</div>
		<div>
			<header class="_acrylic">{{ i18n.ts.customEmojis }}</header>
			<XSection v-for="category in customEmojiCategories" :key="'custom:' + category" :initial-shown="false" :emojis="customEmojis.filter(e => e.category === category).map(e => ':' + e.name + ':')" @chosen="chosen">{{ category || i18n.ts.other }}</XSection>
		</div>
		<div>
			<header class="_acrylic">{{ i18n.ts.emoji }}</header>
			<XSection v-for="category in categories" :key="category" :emojis="emojilist.filter(e => e.category === category).map(e => e.char)" @chosen="chosen">{{ category }}</XSection>
		</div>
	</div>
	<div class="tabs">
		<button class="_button tab" :class="{ active: tab === 'index' }" @click="tab = 'index'"><i class="fas fa-asterisk fa-fw"></i></button>
		<button class="_button tab" :class="{ active: tab === 'custom' }" @click="tab = 'custom'"><i class="fas fa-laugh fa-fw"></i></button>
		<button class="_button tab" :class="{ active: tab === 'unicode' }" @click="tab = 'unicode'"><i class="fas fa-leaf fa-fw"></i></button>
		<button class="_button tab" :class="{ active: tab === 'tags' }" @click="tab = 'tags'"><i class="fas fa-hashtag fa-fw"></i></button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import { emojilist, UnicodeEmojiDef, unicodeEmojiCategories as categories } from '@/scripts/emojilist';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';
import Ripple from '@/components/ripple.vue';
import * as os from '@/os';
import { isTouchUsing } from '@/scripts/touch';
import { deviceKind } from '@/scripts/device-kind';
import { emojiCategories, instance } from '@/instance';
import XSection from './emoji-picker.section.vue';
import { i18n } from '@/i18n';
import { defaultStore } from '@/store';

const props = withDefaults(defineProps<{
	showPinned?: boolean;
	asReactionPicker?: boolean;
	maxHeight?: number;
	asDrawer?: boolean;
}>(), {
	showPinned: true,
});

const emit = defineEmits<{
	(ev: 'chosen', v: string): void;
}>();

const search = ref<HTMLInputElement>();
const emojis = ref<HTMLDivElement>();

const {
	reactions: pinned,
	reactionPickerSize,
	reactionPickerWidth,
	reactionPickerHeight,
	disableShowingAnimatedImages,
	recentlyUsedEmojis,
} = defaultStore.reactiveState;

const size = computed(() => props.asReactionPicker ? reactionPickerSize.value : 1);
const width = computed(() => props.asReactionPicker ? reactionPickerWidth.value : 3);
const height = computed(() => props.asReactionPicker ? reactionPickerHeight.value : 2);
const customEmojiCategories = emojiCategories;
const customEmojis = instance.emojis;
const q = ref<string | null>(null);
const searchResultCustom = ref<Misskey.entities.CustomEmoji[]>([]);
const searchResultUnicode = ref<UnicodeEmojiDef[]>([]);
const tab = ref<'index' | 'custom' | 'unicode' | 'tags'>('index');

watch(q, () => {
	if (emojis.value) emojis.value.scrollTop = 0;

	if (q.value == null || q.value === '') {
		searchResultCustom.value = [];
		searchResultUnicode.value = [];
		return;
	}

	const newQ = q.value.replace(/:/g, '');

	const searchCustom = () => {
		const max = 8;
		const emojis = customEmojis;
		const matches = new Set<Misskey.entities.CustomEmoji>();

		const exactMatch = emojis.find(emoji => emoji.name === newQ);
		if (exactMatch) matches.add(exactMatch);

		if (newQ.includes(' ')) { // AND検索
			const keywords = newQ.split(' ');

			// 名前にキーワードが含まれている
			for (const emoji of emojis) {
				if (keywords.every(keyword => emoji.name.includes(keyword))) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			// 名前またはエイリアスにキーワードが含まれている
			for (const emoji of emojis) {
				if (keywords.every(keyword => emoji.name.includes(keyword) || emoji.aliases.some(alias => alias.includes(keyword)))) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
		} else {
			for (const emoji of emojis) {
				if (emoji.name.startsWith(newQ)) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const emoji of emojis) {
				if (emoji.aliases.some(alias => alias.startsWith(newQ))) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const emoji of emojis) {
				if (emoji.name.includes(newQ)) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const emoji of emojis) {
				if (emoji.aliases.some(alias => alias.includes(newQ))) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
		}

		return matches;
	};

	const searchUnicode = () => {
		const max = 8;
		const emojis = emojilist;
		const matches = new Set<UnicodeEmojiDef>();

		const exactMatch = emojis.find(emoji => emoji.name === newQ);
		if (exactMatch) matches.add(exactMatch);

		if (newQ.includes(' ')) { // AND検索
			const keywords = newQ.split(' ');

			// 名前にキーワードが含まれている
			for (const emoji of emojis) {
				if (keywords.every(keyword => emoji.name.includes(keyword))) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			// 名前またはエイリアスにキーワードが含まれている
			for (const emoji of emojis) {
				if (keywords.every(keyword => emoji.name.includes(keyword) || emoji.keywords.some(alias => alias.includes(keyword)))) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
		} else {
			for (const emoji of emojis) {
				if (emoji.name.startsWith(newQ)) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const emoji of emojis) {
				if (emoji.keywords.some(keyword => keyword.startsWith(newQ))) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const emoji of emojis) {
				if (emoji.name.includes(newQ)) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const emoji of emojis) {
				if (emoji.keywords.some(keyword => keyword.includes(newQ))) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
		}

		return matches;
	};

	searchResultCustom.value = Array.from(searchCustom());
	searchResultUnicode.value = Array.from(searchUnicode());
});

function focus() {
	if (!['smartphone', 'tablet'].includes(deviceKind) && !isTouchUsing) {
		search.value?.focus({
			preventScroll: true
		});
	}
}

function reset() {
	if (emojis.value) emojis.value.scrollTop = 0;
	q.value = '';
}

function getKey(emoji: string | Misskey.entities.CustomEmoji | UnicodeEmojiDef): string {
	return typeof emoji === 'string' ? emoji : (emoji.char || `:${emoji.name}:`);
}

function chosen(emoji: any, ev?: MouseEvent) {
	const el = ev && (ev.currentTarget ?? ev.target) as HTMLElement | null | undefined;
	if (el) {
		const rect = el.getBoundingClientRect();
		const x = rect.left + (el.offsetWidth / 2);
		const y = rect.top + (el.offsetHeight / 2);
		os.popup(Ripple, { x, y }, {}, 'end');
	}

	const key = getKey(emoji);
	emit('chosen', key);

	// 最近使った絵文字更新
	if (!pinned.value.includes(key)) {
		let recents = defaultStore.state.recentlyUsedEmojis;
		recents = recents.filter((emoji: any) => emoji !== key);
		recents.unshift(key);
		defaultStore.set('recentlyUsedEmojis', recents.splice(0, 32));
	}
}

function paste(event: ClipboardEvent) {
	const paste = (event.clipboardData || window.clipboardData).getData('text');
	if (done(paste)) {
		event.preventDefault();
	}
}

function done(query?: any): boolean | void {
	if (query == null) query = q.value;
	if (query == null || typeof query !== 'string') return;

	const q2 = query.replace(/:/g, '');
	const exactMatchCustom = customEmojis.find(emoji => emoji.name === q2);
	if (exactMatchCustom) {
		chosen(exactMatchCustom);
		return true;
	}
	const exactMatchUnicode = emojilist.find(emoji => emoji.char === q2 || emoji.name === q2);
	if (exactMatchUnicode) {
		chosen(exactMatchUnicode);
		return true;
	}
	if (searchResultCustom.value.length > 0) {
		chosen(searchResultCustom.value[0]);
		return true;
	}
	if (searchResultUnicode.value.length > 0) {
		chosen(searchResultUnicode.value[0]);
		return true;
	}
}

onMounted(() => {
	focus();
});

defineExpose({
	focus,
	reset,
});
</script>

<style lang="scss" scoped>
.omfetrab {
	$pad: 8px;

	display: flex;
	flex-direction: column;

	&.s1 {
		--eachSize: 40px;
	}

	&.s2 {
		--eachSize: 45px;
	}

	&.s3 {
		--eachSize: 50px;
	}

	&.w1 {
		width: calc((var(--eachSize) * 5) + (#{$pad} * 2));
		--columns: 1fr 1fr 1fr 1fr 1fr;
	}

	&.w2 {
		width: calc((var(--eachSize) * 6) + (#{$pad} * 2));
		--columns: 1fr 1fr 1fr 1fr 1fr 1fr;
	}

	&.w3 {
		width: calc((var(--eachSize) * 7) + (#{$pad} * 2));
		--columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
	}

	&.w4 {
		width: calc((var(--eachSize) * 8) + (#{$pad} * 2));
		--columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
	}

	&.w5 {
		width: calc((var(--eachSize) * 9) + (#{$pad} * 2));
		--columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
	}

	&.h1 {
		height: calc((var(--eachSize) * 4) + (#{$pad} * 2));
	}

	&.h2 {
		height: calc((var(--eachSize) * 6) + (#{$pad} * 2));
	}

	&.h3 {
		height: calc((var(--eachSize) * 8) + (#{$pad} * 2));
	}

	&.h4 {
		height: calc((var(--eachSize) * 10) + (#{$pad} * 2));
	}

	&.asDrawer {
		width: 100% !important;

		> .emojis {
			::v-deep(section) {
				> header {
					height: 32px;
					line-height: 32px;
					padding: 0 12px;
					font-size: 15px;
				}

				> div {
					display: grid;
					grid-template-columns: var(--columns);

					> button {
						aspect-ratio: 1 / 1;
						width: auto;
						height: auto;
						min-width: 0;

						> * {
							font-size: 30px;
						}
					}
				}
			}
		}
	}

	> .search {
		width: 100%;
		padding: 12px;
		box-sizing: border-box;
		font-size: 1em;
		outline: none;
		border: none;
		background: transparent;
		color: var(--fg);

		&:not(.filled) {
			order: 1;
			z-index: 2;
			box-shadow: 0px -1px 0 0px var(--divider);
		}
	}

	> .tabs {
		display: flex;
		display: none;

		> .tab {
			flex: 1;
			height: 38px;
			border-top: solid 0.5px var(--divider);

			&.active {
				border-top: solid 1px var(--accent);
				color: var(--accent);
			}
		}
	}

	> .emojis {
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;

		scrollbar-width: none;

		&::-webkit-scrollbar {
			display: none;
		}

		> div {
			&:not(.index) {
				padding: 4px 0 8px 0;
				border-top: solid 0.5px var(--divider);
			}

			> header {
				/*position: sticky;
				top: 0;
				left: 0;*/
				height: 32px;
				line-height: 32px;
				z-index: 2;
				padding: 0 8px;
				font-size: 12px;
			}
		}

		::v-deep(section) {
			> header {
				position: sticky;
				top: 0;
				left: 0;
				height: 32px;
				line-height: 32px;
				z-index: 1;
				padding: 0 8px;
				font-size: 12px;
				cursor: pointer;

				&:hover {
					color: var(--accent);
				}
			}

			> div {
				position: relative;
				padding: $pad;

				> button {
					position: relative;
					padding: 0;
					width: var(--eachSize);
					height: var(--eachSize);
					border-radius: 4px;

					&:focus-visible {
						outline: solid 2px var(--focus);
						z-index: 1;
					}

					&:hover {
						background: rgba(0, 0, 0, 0.05);
					}

					&:active {
						background: var(--accent);
						box-shadow: inset 0 0.15em 0.3em rgba(27, 31, 35, 0.15);
					}

					> * {
						font-size: 24px;
						height: 1.25em;
						vertical-align: -.25em;
						pointer-events: none;
					}
				}
			}

			&.result {
				border-bottom: solid 0.5px var(--divider);

				&:empty {
					display: none;
				}
			}
		}
	}
}
</style>
