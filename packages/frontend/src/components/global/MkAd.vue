<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="chosen && !shouldHide" :class="$style.root">
	<div
		v-if="!showMenu"
		:class="[$style.main, {
			[$style.form_square]: chosen.place === 'square',
			[$style.form_horizontal]: chosen.place === 'horizontal',
			[$style.form_horizontalBig]: chosen.place === 'horizontal-big',
			[$style.form_vertical]: chosen.place === 'vertical',
		}]"
	>
		<a :href="chosen.url" target="_blank" :class="$style.link">
			<img :src="chosen.imageUrl" :class="$style.img">
			<button class="_button" :class="$style.i" @click.prevent.stop="toggleMenu"><i :class="$style.iIcon" class="ti ti-info-circle"></i></button>
		</a>
	</div>
	<div v-else :class="$style.menu">
		<div :class="$style.menuContainer">
			<div>Ads by {{ host }}</div>
			<!--<MkButton class="button" primary>{{ i18n.ts._ad.like }}</MkButton>-->
			<MkButton v-if="chosen.ratio !== 0" :class="$style.menuButton" @click="reduceFrequency">{{ i18n.ts._ad.reduceFrequencyOfThisAd }}</MkButton>
			<button class="_textButton" @click="toggleMenu">{{ i18n.ts._ad.back }}</button>
		</div>
	</div>
</div>
<div v-else></div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { i18n } from '@/i18n';
import { instance } from '@/instance';
import { host } from '@/config';
import MkButton from '@/components/MkButton.vue';
import { defaultStore } from '@/store';
import * as os from '@/os';
import { $i } from '@/account';

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
const shouldHide = $ref(!defaultStore.state.forceShowAds && $i && $i.policies.canHideAds && (props.specify == null));

function reduceFrequency(): void {
	if (chosen.value == null) return;
	if (defaultStore.state.mutedAds.includes(chosen.value.id)) return;
	defaultStore.push('mutedAds', chosen.value.id);
	os.success();
	chosen.value = choseAd();
	showMenu.value = false;
}
</script>

<style lang="scss" module>
.root {
	background-size: auto auto;
	background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, var(--ad) 8px, var(--ad) 14px );
}

.main {
	text-align: center;

	&.form_square {
		> .link,
		> .link > .img {
			max-width: min(300px, 100%);
			max-height: 300px;
		}
	}

	&.form_horizontal {
		padding: 8px;

		> .link,
		> .link > .img {
			max-width: min(600px, 100%);
			max-height: 80px;
		}
	}

	&.form_horizontalBig {
		padding: 8px;

		> .link,
		> .link > .img {
			max-width: min(600px, 100%);
			max-height: 250px;
		}
	}

	&.form_vertical {
		> .link,
		> .link > .img {
			max-width: min(100px, 100%);
		}
	}
}

.link {
	display: inline-block;
	position: relative;
	vertical-align: bottom;

	&:hover {
		> .img {
			filter: contrast(120%);
		}
	}
}

.img {
	display: block;
	object-fit: contain;
	margin: auto;
	border-radius: 5px;
}

.i {
	position: absolute;
	top: 1px;
	right: 1px;
	display: grid;
	place-content: center;
	background: var(--panel);
	border-radius: 100%;
	padding: 2px;
}

.iIcon {
	font-size: 14px;
	line-height: 17px;
}

.menu {
	padding: 8px;
	text-align: center;
}

.menuContainer {
	padding: 8px;
	margin: 0 auto;
	max-width: 400px;
	border: solid 1px var(--divider);
}

.menuButton {
	margin: 8px auto;
}
</style>
