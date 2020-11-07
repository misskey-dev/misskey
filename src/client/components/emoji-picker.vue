<template>
<MkModal ref="modal" :src="src" @click="$refs.modal.close()" @closed="$emit('closed')">
	<div class="omfetrab _popup">
		<input ref="search" class="search" v-model.trim="q" :placeholder="$t('search')" @paste.stop="paste" @keyup.enter="done()" autofocus>
		<div class="emojis">
			<section class="result">
				<div v-if="searchResultCustom.length > 0">
					<button v-for="emoji in searchResultCustom"
						class="_button"
						:title="emoji.name"
						@click="chosen(emoji, $event)"
						:key="emoji"
						tabindex="0"
					>
						<MkEmoji v-if="emoji.char != null" :emoji="emoji.char"/>
						<img v-else :src="$store.state.device.disableShowingAnimatedImages ? getStaticImageUrl(emoji.url) : emoji.url"/>
					</button>
				</div>
				<div v-if="searchResultUnicode.length > 0">
					<button v-for="emoji in searchResultUnicode"
						class="_button"
						:title="emoji.name"
						@click="chosen(emoji, $event)"
						:key="emoji.name"
						tabindex="0"
					>
						<MkEmoji :emoji="emoji.char"/>
					</button>
				</div>
			</section>

			<div class="index">
				<section>
					<div>
						<button v-for="emoji in reactions || $store.state.settings.reactions"
							class="_button"
							:title="emoji.name"
							@click="chosen(emoji, $event)"
							:key="emoji"
							tabindex="0"
						>
							<MkEmoji :emoji="emoji.startsWith(':') ? null : emoji" :name="emoji.startsWith(':') ? emoji.substr(1, emoji.length - 2) : null" :normal="true"/>
						</button>
					</div>
				</section>

				<section>
					<header class="_acrylic"><Fa :icon="faHistory" fixed-width/> {{ $t('recentUsed') }}</header>
					<div>
						<button v-for="emoji in ($store.state.device.recentEmojis || [])"
							class="_button"
							:title="emoji.name"
							@click="chosen(emoji, $event)"
							:key="emoji"
						>
							<MkEmoji v-if="emoji.char != null" :emoji="emoji.char"/>
							<img v-else :src="$store.state.device.disableShowingAnimatedImages ? getStaticImageUrl(emoji.url) : emoji.url"/>
						</button>
					</div>
				</section>

				<div class="arrow"><Fa :icon="faChevronDown"/></div>
			</div>

			<section v-for="category in customEmojiCategories" :key="'custom:' + category" class="custom">
				<header class="_acrylic" v-appear="() => visibleCategories[category] = true">{{ category || $t('other') }}</header>
				<div v-if="visibleCategories[category]">
					<button v-for="emoji in customEmojis.filter(e => e.category === category)"
						class="_button"
						:title="emoji.name"
						@click="chosen(emoji, $event)"
						:key="emoji.name"
					>
						<img :src="$store.state.device.disableShowingAnimatedImages ? getStaticImageUrl(emoji.url) : emoji.url"/>
					</button>
				</div>
			</section>

			<section v-for="category in categories" :key="category.name" class="unicode">
				<header class="_acrylic" v-appear="() => category.isActive = true"><Fa :icon="category.icon" fixed-width/> {{ category.name }}</header>
				<div v-if="category.isActive">
					<button v-for="emoji in emojilist.filter(e => e.category === category.name)"
						class="_button"
						:title="emoji.name"
						@click="chosen(emoji, $event)"
						:key="emoji.name"
					>
						<MkEmoji :emoji="emoji.char"/>
					</button>
				</div>
			</section>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import { emojilist } from '../../misc/emojilist';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';
import { faAsterisk, faLeaf, faUtensils, faFutbol, faCity, faDice, faGlobe, faHistory, faUser, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { faHeart, faFlag, faLaugh } from '@fortawesome/free-regular-svg-icons';
import MkModal from '@/components/ui/modal.vue';
import Particle from '@/components/particle.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkModal,
	},

	props: {
		src: {
			required: false
		},
		reactions: {
			required: false
		},
	},

	emits: ['done', 'closed'],

	data() {
		return {
			emojilist: markRaw(emojilist),
			getStaticImageUrl,
			customEmojiCategories: this.$store.getters['instance/emojiCategories'],
			customEmojis: this.$store.state.instance.meta.emojis,
			visibleCategories: {},
			q: null,
			searchResultCustom: [],
			searchResultUnicode: [],
			faGlobe, faHistory, faChevronDown,
			categories: [{
				name: 'face',
				icon: faLaugh,
				isActive: false
			}, {
				name: 'people',
				icon: faUser,
				isActive: false
			}, {
				name: 'animals_and_nature',
				icon: faLeaf,
				isActive: false
			}, {
				name: 'food_and_drink',
				icon: faUtensils,
				isActive: false
			}, {
				name: 'activity',
				icon: faFutbol,
				isActive: false
			}, {
				name: 'travel_and_places',
				icon: faCity,
				isActive: false
			}, {
				name: 'objects',
				icon: faDice,
				isActive: false
			}, {
				name: 'symbols',
				icon: faHeart,
				isActive: false
			}, {
				name: 'flags',
				icon: faFlag,
				isActive: false
			}],
			faAsterisk
		};
	},

	watch: {
		q() {
			if (this.q == null || this.q === '') {
				this.searchResultCustom = [];
				this.searchResultUnicode = [];
				return;
			}

			const q = this.q.replace(/:/g, '');

			const searchCustom = () => {
				const max = 8;
				const emojis = this.customEmojis;
				const matches = new Set();

				const exactMatch = emojis.find(e => e.name === q);
				if (exactMatch) matches.add(exactMatch);

				for (const emoji of emojis) {
					if (emoji.name.startsWith(q)) {
						matches.add(emoji);
						if (matches.size >= max) break;
					}
				}
				if (matches.size >= max) return matches;

				for (const emoji of emojis) {
					if (emoji.aliases.some(alias => alias.startsWith(q))) {
						matches.add(emoji);
						if (matches.size >= max) break;
					}
				}
				if (matches.size >= max) return matches;

				for (const emoji of emojis) {
					if (emoji.name.includes(q)) {
						matches.add(emoji);
						if (matches.size >= max) break;
					}
				}
				if (matches.size >= max) return matches;

				for (const emoji of emojis) {
					if (emoji.aliases.some(alias => alias.includes(q))) {
						matches.add(emoji);
						if (matches.size >= max) break;
					}
				}
				return matches;
			};

			const searchUnicode = () => {
				const max = 8;
				const emojis = this.emojilist;
				const matches = new Set();

				const exactMatch = emojis.find(e => e.name === q);
				if (exactMatch) matches.add(exactMatch);

				for (const emoji of emojis) {
					if (emoji.name.startsWith(q)) {
						matches.add(emoji);
						if (matches.size >= max) break;
					}
				}
				if (matches.size >= max) return matches;

				for (const emoji of emojis) {
					if (emoji.keywords.some(keyword => keyword.startsWith(q))) {
						matches.add(emoji);
						if (matches.size >= max) break;
					}
				}
				if (matches.size >= max) return matches;

				for (const emoji of emojis) {
					if (emoji.name.includes(q)) {
						matches.add(emoji);
						if (matches.size >= max) break;
					}
				}
				if (matches.size >= max) return matches;

				for (const emoji of emojis) {
					if (emoji.keywords.some(keyword => keyword.includes(q))) {
						matches.add(emoji);
						if (matches.size >= max) break;
					}
				}
				return matches;
			};

			this.searchResultCustom = Array.from(searchCustom());
			this.searchResultUnicode = Array.from(searchUnicode());
		}
	},

	mounted() {
		this.$refs.search.focus({
			preventScroll: true
		});
	},

	methods: {
		chosen(emoji: any, ev) {
			if (ev) {
				const el = ev.currentTarget || ev.target;
				const rect = el.getBoundingClientRect();
				const x = rect.left + (el.clientWidth / 2);
				const y = rect.top + (el.clientHeight / 2);
				os.popup(Particle, { x, y }, {}, 'end');
			}

			const getKey = (emoji: any) => typeof emoji === 'string' ? emoji : emoji.char || `:${emoji.name}:`;
			this.$emit('done', getKey(emoji));
			this.$refs.modal.close();

			// 最近使った絵文字更新
			let recents = this.$store.state.device.recentEmojis || [];
			recents = recents.filter((e: any) => getKey(e) !== getKey(emoji));
			recents.unshift(emoji)
			this.$store.commit('device/set', { key: 'recentEmojis', value: recents.splice(0, 16) });
		},

		paste(event) {
			const paste = (event.clipboardData || window.clipboardData).getData('text');
			if (this.done(paste)) {
				event.preventDefault();
			}
		},

		done(query) {
			if (query == null) query = this.q;
			if (query == null) return;
			const q = query.replace(/:/g, '');
			const exactMatchCustom = this.customEmojis.find(e => e.name === q);
			if (exactMatchCustom) {
				this.chosen(exactMatchCustom);
				return true;
			}
			const exactMatchUnicode = this.emojilist.find(e => e.char === q || e.name === q);
			if (exactMatchUnicode) {
				this.chosen(exactMatchUnicode);
				return true;
			}
		},
	}
});
</script>

<style lang="scss" scoped>
.omfetrab {
	width: 350px;
	contain: content;

	> .search {
		width: 100%;
		padding: 12px;
		box-sizing: border-box;
		font-size: 1em;
		outline: none;
		border: none;
		background: transparent;
		color: var(--fg);
	}

	> .emojis {
		$height: 300px;

		height: $height;
		overflow-y: auto;
		overflow-x: hidden;

		> .index {
			min-height: $height;
			position: relative;
			border-bottom: solid 1px var(--divider);
				
			> .arrow {
				position: absolute;
				bottom: 0;
				left: 0;
				width: 100%;
				padding: 16px 0;
				text-align: center;
				opacity: 0.5;
				pointer-events: none;
			}
		}

		section {
			> header {
				position: sticky;
				top: 0;
				left: 0;
				z-index: 1;
				padding: 8px;
				font-size: 12px;
			}

			> div {
				display: grid;
				grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
				gap: 4px;
				padding: 8px;

				> button {
					position: relative;
					padding: 0;
					width: 100%;

					&:focus {
						outline: solid 2px var(--focus);
						z-index: 1;
					}

					&:before {
						content: '';
						display: block;
						width: 1px;
						height: 0;
						padding-bottom: 100%;
					}

					&:hover {
						> * {
							transform: scale(1.2);
							transition: transform 0s;
						}
					}

					> * {
						position: absolute;
						top: 0;
						left: 0;
						width: 100%;
						height: 100%;
						object-fit: contain;
						font-size: 28px;
						transition: transform 0.2s ease;
						pointer-events: none;
					}
				}
			}

			&.result {
				border-bottom: solid 1px var(--divider);
			}

			&.unicode {
				min-height: 384px;
			}

			&.custom {
				min-height: 64px;
			}
		}
	}
}
</style>
