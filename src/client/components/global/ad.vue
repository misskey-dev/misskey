<template>
<div class="qiivuoyo" v-if="ad">
	<div class="main" :class="ad.place" v-if="!showMenu">
		<a :href="ad.url" target="_blank">
			<img :src="ad.imageUrl">
			<button class="_button menu" @click.prevent.stop="toggleMenu"><span class="fas fa-info-circle"></span></button>
		</a>
	</div>
	<div class="menu" v-else>
		
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { instance } from '@client/instance';

export default defineComponent({
	props: {
		prefer: {
			type: String,
			required: true
		},
		ad: {
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

		if (props.ad) {
			ad = props.ad;
		} else {
			let ads = instance.ads.filter(ad => ad.place === props.prefer);

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
		};
	}
});
</script>

<style lang="scss" scoped>
.qiivuoyo {
	background-size: auto auto;
	background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, var(--ad) 8px, var(--ad) 14px );

	> .main {
		> a {
			display: block;
			position: relative;
			margin: 0 auto;

			> img {
				display: block;
				width: 100%;
				height: 100%;
				object-fit: contain;
			}

			> .menu {
				position: absolute;
				top: 0;
				right: 0;
				background: var(--panel);
			}
		}

		&.square {
			> a {
				max-width: min(300px, 100%);
				max-height: min(300px, 100%);
			}
		}

		&.horizontal {
			padding: 8px;

			> a {
				max-width: min(600px, 100%);
				max-height: min(100px, 100%);
			}
		}

		&.vertical {
			> a {
				max-width: min(100px, 100%);
			}
		}
	}
}
</style>
