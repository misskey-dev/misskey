<template>
<div class="qiivuoyo">
	<div class="main" :class="ad.shape" v-if="!showMenu">
		<a :href="ad.url" target="_blank">
			<img :src="ad.img">
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

	setup() {
		const showMenu = ref(false);
		const toggleMenu = () => {
			showMenu.value = !showMenu.value;
		};

		return {
			ad: {
				shape: 'square',
				url: '',
				img: 'https://s3.arkjp.net/misskey/f735d88a-c0b8-4f42-b1d8-03d281282cb4.gif'
			},
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
