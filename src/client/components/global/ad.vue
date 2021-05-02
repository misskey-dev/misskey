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

export default defineComponent({
	props: {
		prefer: {
			type: String,
			required: true
		},
	},

	setup(props) {
		const showMenu = ref(false);
		const toggleMenu = () => {
			showMenu.value = !showMenu.value;
		};

		let ads = this.$instance.ads.find(ad => ad.place === props.prefer);

		if (ads.length === 0) {
			ads = this.$instance.ads.find(ad => ad.place === 'square');
		}

		const ad = ads.length === 0 ? null : ads[Math.floor(Math.random() * ads.length)];

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
			> a {
				max-width: 100%;
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
