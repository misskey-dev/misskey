<template>
<div class="omfetrab">
	<header>
		<button v-for="(category, i) in categories"
			class="_button"
			@click="go(category)"
			:class="{ active: category.isActive }"
			:key="i"
		>
			<Fa :icon="category.icon" fixed-width/>
		</button>
	</header>

	<div class="emojis">
		<template v-if="categories[0].isActive">
			<header class="category"><Fa :icon="faHistory" fixed-width/> {{ $t('recentUsed') }}</header>
			<div class="list">
				<button v-for="emoji in ($store.state.device.recentEmojis || [])"
					class="_button"
					:title="emoji.name"
					@click="chosen(emoji)"
					:key="emoji"
				>
					<MkEmoji v-if="emoji.char != null" :emoji="emoji.char"/>
					<img v-else :src="$store.state.device.disableShowingAnimatedImages ? getStaticImageUrl(emoji.url) : emoji.url"/>
				</button>
			</div>

			<header class="category"><Fa :icon="faAsterisk" fixed-width/> {{ $t('customEmojis') }}</header>
		</template>

		<template v-if="categories.find(x => x.isActive).name">
			<div class="list">
				<button v-for="emoji in emojilist.filter(e => e.category === categories.find(x => x.isActive).name)"
					class="_button"
					:title="emoji.name"
					@click="chosen(emoji)"
					:key="emoji.name"
				>
					<MkEmoji :emoji="emoji.char"/>
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
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { emojilist } from '../../misc/emojilist';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';
import { faAsterisk, faLeaf, faUtensils, faFutbol, faCity, faDice, faGlobe, faHistory, faUser } from '@fortawesome/free-solid-svg-icons';
import { faHeart, faFlag, faLaugh } from '@fortawesome/free-regular-svg-icons';
import { groupByX } from '../../prelude/array';
import * as os from '@/os';

export default defineComponent({
	emits: ['done'],

	data() {
		return {
			emojilist,
			getStaticImageUrl,
			customEmojis: {},
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

		chosen(emoji: any) {
			const getKey = (emoji: any) => emoji.char || `:${emoji.name}:`;
			let recents = this.$store.state.device.recentEmojis || [];
			recents = recents.filter((e: any) => getKey(e) !== getKey(emoji));
			recents.unshift(emoji)
			this.$store.commit('device/set', { key: 'recentEmojis', value: recents.splice(0, 16) });
			this.$emit('done', getKey(emoji));
		},
	}
});
</script>

<style lang="scss" scoped>
.omfetrab {
	background: var(--bg);
	border-radius: var(--radius);
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
