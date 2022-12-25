<template>
<div v-if="chosen" class="qiivuoyo">
	<div v-if="!showMenu" class="main" :class="chosen.place">
		<a :href="chosen.url" target="_blank">
			<img :src="chosen.imageUrl">
			<button class="_button menu" @click.prevent.stop="toggleMenu"><span class="ti ti-info-circle info-circle"></span></button>
		</a>
	</div>
	<div v-else class="menu">
		<div class="body">
			<div>Ads by {{ host }}</div>
			<!--<MkButton class="button" primary>{{ $ts._ad.like }}</MkButton>-->
			<MkButton v-if="chosen.ratio !== 0" class="button" @click="reduceFrequency">{{ $ts._ad.reduceFrequencyOfThisAd }}</MkButton>
			<button class="_textButton" @click="toggleMenu">{{ $ts._ad.back }}</button>
		</div>
	</div>
</div>
<div v-else></div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { instance } from '@/instance';
import { host } from '@/config';
import MkButton from '@/components/MkButton.vue';
import { defaultStore } from '@/store';
import * as os from '@/os';

type Ad = (typeof instance)['ads'][number];

const props = defineProps<{
	prefer: string[];
	specify?: Ad;
}>();

const showMenu = ref(false);
const toggleMenu = (): void => {
	showMenu.value = !showMenu.value;
};

const choseAd = (): Ad | null => {
	if (props.specify) {
		return props.specify;
	}

	const allAds = instance.ads.map(ad => defaultStore.state.mutedAds.includes(ad.id) ? {
		...ad,
		ratio: 0,
	} : ad);

	let ads = allAds.filter(ad => props.prefer.includes(ad.place));

	if (ads.length === 0) {
		ads = allAds.filter(ad => ad.place === 'square');
	}

	const lowPriorityAds = ads.filter(ad => ad.ratio === 0);
	ads = ads.filter(ad => ad.ratio !== 0);

	if (ads.length === 0) {
		if (lowPriorityAds.length !== 0) {
			return lowPriorityAds[Math.floor(Math.random() * lowPriorityAds.length)];
		} else {
			return null;
		}
	}

	const totalFactor = ads.reduce((a, b) => a + b.ratio, 0);
	const r = Math.random() * totalFactor;

	let stackedFactor = 0;
	for (const ad of ads) {
		if (r >= stackedFactor && r <= stackedFactor + ad.ratio) {
			return ad;
		} else {
			stackedFactor += ad.ratio;
		}
	}

	return null;
};

const chosen = ref(choseAd());

function reduceFrequency(): void {
	if (chosen.value == null) return;
	if (defaultStore.state.mutedAds.includes(chosen.value.id)) return;
	defaultStore.push('mutedAds', chosen.value.id);
	os.success();
	chosen.value = choseAd();
	showMenu.value = false;
}
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
				border-radius: 5px;
			}

			> .menu {
				position: absolute;
				top: 1px;
				right: 1px;

				> .info-circle {
					border: 3px solid var(--panel);
					border-radius: 50%;
					background: var(--panel);
				}
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

			> .button {
				margin: 8px auto;
			}
		}
	}
}
</style>
