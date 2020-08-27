<template>
<x-popup :source="source" ref="popup" @closed="() => { $emit('closed'); destroyDom(); }">
	<div class="omfetrab">
		<header>
			<button v-for="(category, i) in categories"
				class="_button"
				@click="go(category)"
				:class="{ active: category.isActive }"
				:key="i"
			>
				<fa :icon="category.icon" fixed-width/>
			</button>
		</header>

		<div class="skinTones" v-if="categories.find(x => x.isActive).name === 'people'">
			<button class="skinTone" v-for="st in SKIN_TONES" :key="st" @click="changeSkinTone(st)">
				<mk-emoji :emoji="getSkinToneModifiedChar(SKIN_TONES_SAMPLE, st)"/>
			</button>
		</div>

		<div class="emojis">
			<template v-if="categories[0].isActive">
				<header class="category"><fa :icon="faHistory" fixed-width/> {{ $t('recentUsed') }}</header>
				<div class="list">
					<button v-for="(emoji, i) in ($store.state.device.recentEmojis || [])"
						class="_button"
						:title="emoji.name"
						@click="chosen(emoji)"
						:key="i"
					>
						<mk-emoji v-if="emoji.char != null" :emoji="emoji.char"/>
						<img v-else :src="$store.state.device.disableShowingAnimatedImages ? getStaticImageUrl(emoji.url) : emoji.url"/>
					</button>
				</div>

				<header class="category"><fa :icon="faAsterisk" fixed-width/> {{ $t('customEmojis') }}</header>
			</template>

			<template v-if="categories.find(x => x.isActive).name">
				<div class="list">
					<button v-for="emoji in emojilist.filter(e => e.category === categories.find(x => x.isActive).name)"
						class="_button"
						:title="emoji.name"
						@click="chosen(emoji, skinTone)"
						:key="`${emoji.name}-${skinTone}`"
					>
						<mk-emoji v-if="emoji.char != null" :emoji="emojiToSkinToneModifiedChar(emoji, skinTone)"/>
					</button>
				</div>
			</template>
			<template v-else>
				<div v-for="(key, i) in Object.keys(customEmojis)" :key="i">
					<header class="sub" v-if="key">{{ key }}</header>
					<div class="list">
						<button v-for="emoji in customEmojis[key]"
							class="_button"
							:title="emoji.name"
							@click="chosen(emoji)"
							:key="emoji.name"
						>
							<img :src="$store.state.device.disableShowingAnimatedImages ? getStaticImageUrl(emoji.url) : emoji.url"/>
						</button>
					</div>
				</div>
			</template>
		</div>
	</div>
</x-popup>
</template>

<script lang="ts">
import Vue from 'vue';
import { emojilist } from '../../misc/emojilist';
import { getStaticImageUrl } from '../scripts/get-static-image-url';
import { faAsterisk, faLeaf, faUtensils, faFutbol, faCity, faDice, faGlobe, faHistory, faUser } from '@fortawesome/free-solid-svg-icons';
import { faHeart, faFlag, faLaugh } from '@fortawesome/free-regular-svg-icons';
import { groupByX } from '../../prelude/array';
import XPopup from './popup.vue';

const SKIN_TONES_SAMPLE = '\u{1F44D}';	// thumbs up
const SKIN_TONES = Object.freeze([ null, '\u{1F3FB}', '\u{1F3FC}', '\u{1F3FD}', '\u{1F3FE}', '\u{1F3FF}' ]);

export default Vue.extend({
	components: {
		XPopup,
	},

	props: {
		source: {
			required: true
		},
	},

	data() {
		return {
			SKIN_TONES_SAMPLE,
			SKIN_TONES,
			emojilist,
			getStaticImageUrl,
			customEmojis: {},
			skinTone: null as string | null,
			faGlobe, faHistory,
			categories: [{
				icon: faAsterisk,
				isActive: true
			}, {
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

	created() {
		let local = this.$store.state.instance.meta.emojis;
		local = groupByX(local, (x: any) => x.category || '');
		this.customEmojis = local;

		if (SKIN_TONES.includes(this.$store.state.device.emojiSkinTone)) {
			this.skinTone = this.$store.state.device.emojiSkinTone;
		}
	},

	methods: {
		go(category: any) {
			this.goCategory(category.name);
		},

		goCategory(name: string) {
			let matched = false;
			for (const c of this.categories) {
				c.isActive = c.name === name;
				if (c.isActive) {
					matched = true;
				}
			}
			if (!matched) {
				this.categories[0].isActive = true;
			}
		},

		changeSkinTone(skinTone: string) {
			console.log(`change: ${skinTone}`);
			this.skinTone = skinTone;
			this.$store.commit('device/set', { key: 'emojiSkinTone', value: skinTone });
		},

		emojiToSkinToneModifiedChar(emoji: any, skinTone: string | null | undefined): string {
			console.log(`${emoji.char} + ${skinTone}`);
			if (emoji.st === 1) {
				return this.getSkinToneModifiedChar(emoji.char, skinTone);
			} else {
				return emoji.char;
			}
		},

		getSkinToneModifiedChar(char: string, skinTone: string | null | undefined): string {
			if (!skinTone) return char;
			let sgs = Array.from(char);	// split by surrogate pair
			// 2文字目に挿入するが、そこが絵文字セレクタなら置き換える
			if (sgs[1] === '\u{FE0F}') {
				sgs.splice(1, 1, skinTone);
			} else {
				sgs.splice(1, 0, skinTone);
			}
			return sgs.join('');
		},

		chosen(emoji: any, skinTone?: string) {
			const getKey = (emoji: any) => emoji.char ? this.getSkinToneModifiedChar(emoji.char, skinTone) : `:${emoji.name}:`;
			let recents = this.$store.state.device.recentEmojis || [];
			recents = recents.filter((e: any) => getKey(e) !== getKey(emoji));
			recents.unshift(emoji)
			this.$store.commit('device/set', { key: 'recentEmojis', value: recents.splice(0, 16) });
			this.$emit('chosen', getKey(emoji));
		},

		close() {
			this.$refs.popup.close();
		}
	}
});
</script>

<style lang="scss" scoped>
.omfetrab {
	width: 350px;

	> header {
		display: flex;

		> button {
			flex: 1;
			padding: 10px 0;
			font-size: 16px;
			transition: color 0.2s ease;

			&:hover {
				color: var(--textHighlighted);
				transition: color 0s;
			}

			&.active {
				color: var(--accent);
				transition: color 0s;
			}
		}
	}

	> .skinTones {
			display: flex;
			justify-content: flex-end;
			margin: 8px;

		.skinTone {
			border: none;
			background: transparent;
			padding: 0 6px;
			cursor: pointer;
		}
	}

	> .emojis {
		height: 300px;
		overflow-y: auto;
		overflow-x: hidden;

		> header.category {
			position: sticky;
			top: 0;
			left: 0;
			z-index: 1;
			padding: 8px;
			background: var(--panel);
			font-size: 12px;
		}

		header.sub {
			padding: 4px 8px;
			font-size: 12px;
		}

		div.list {
			display: grid;
			grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
			gap: 4px;
			padding: 8px;

			> button {
				position: relative;
				padding: 0;
				width: 100%;

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
	}
}
</style>
