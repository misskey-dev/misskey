<template>
<div class="qiivuoyo" v-if="ad">
	<div class="main" :class="ad.place" v-if="!showMenu">
		<a :href="ad.url" target="_blank">
			<img :src="ad.imageUrl">
			<button class="_button menu" @click.prevent.stop="toggleMenu"><span class="fas fa-info-circle"></span></button>
		</a>
	</div>
	<div class="menu" v-else>
		<div class="body">
			<div>Ads by {{ host }}</div>
			<!--<MkButton>{{ $ts.stopThisAd }}</MkButton>-->
			<button class="_textButton" @click="toggleMenu">{{ $ts.close }}</button>
		</div>
	</div>
</div>
<div v-else></div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { instance } from '@client/instance';
import { host } from '@client/config';
import MkButton from '@client/components/ui/button.vue';

export default defineComponent({
	components: {
		MkButton
	},

	props: {
		prefer: {
			type: Array,
			required: true
		},
		specify: {
			type: Object,
			required: false
		},
	},

	setup(props) {
		const showMenu = ref(false);
		const toggleMenu = () => {
			showMenu.value = !showMenu.value;
		};

		let ad = null;

		if (props.specify) {
			ad = props.specify;
		} else {
			let ads = instance.ads.filter(ad => props.prefer.includes(ad.place));

			if (ads.length === 0) {
				ads = instance.ads.filter(ad => ad.place === 'square');
			}

			const high = ads.filter(ad => ad.priority === 'high');
			const middle = ads.filter(ad => ad.priority === 'middle');
			const low = ads.filter(ad => ad.priority === 'low');

			if (high.length > 0) {
				ad = high[Math.floor(Math.random() * high.length)];
			} else if (middle.length > 0) {
				ad = middle[Math.floor(Math.random() * middle.length)];
			} else if (low.length > 0) {
				ad = low[Math.floor(Math.random() * low.length)];
			}
		}

		return {
			ad,
			showMenu,
			toggleMenu,
			host,
		};
	}
});
</script>

<style lang="scss" scoped>
.qiivuoyo {
	background-size: auto auto;
	background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, var(--ad) 8px, var(--ad) 14px );

	> .main {
		text-align: center;

		> a {
			display: inline-block;
			position: relative;
			vertical-align: bottom;

			&:hover {
				> img {
					filter: contrast(120%);
				}
			}

			> img {
				display: block;
				object-fit: contain;
				margin: auto;
			}

			> .menu {
				position: absolute;
				top: 0;
				right: 0;
				background: var(--panel);
			}
		}

		&.square {
			> a ,
			> a > img {
				max-width: min(300px, 100%);
				max-height: 300px;
			}
		}

		&.horizontal {
			padding: 8px;

			> a ,
			> a > img {
				max-width: min(600px, 100%);
				max-height: 80px;
			}
		}

		&.horizontal-big {
			padding: 8px;

			> a ,
			> a > img {
				max-width: min(600px, 100%);
				max-height: 250px;
			}
		}

		&.vertical {
			> a ,
			> a > img {
				max-width: min(100px, 100%);
			}
		}
	}

	> .menu {
		padding: 8px;
		text-align: center;

		> .body {
			padding: 8px;
			margin: 0 auto;
			max-width: 400px;
			border: solid 1px var(--divider);
		}
	}
}
</style>
