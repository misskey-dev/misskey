<template>
<div class="_panel _shadow" :class="$style.root">
	<!-- TODO: インスタンス運営者が任意のテキストとリンクを設定できるようにする -->
	<div :class="$style.icon">
		<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pig-money" width="40" height="40" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
			<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
			<path d="M15 11v.01"></path>
			<path d="M5.173 8.378a3 3 0 1 1 4.656 -1.377"></path>
			<path d="M16 4v3.803a6.019 6.019 0 0 1 2.658 3.197h1.341a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-1.342c-.336 .95 -.907 1.8 -1.658 2.473v2.027a1.5 1.5 0 0 1 -3 0v-.583a6.04 6.04 0 0 1 -1 .083h-4a6.04 6.04 0 0 1 -1 -.083v.583a1.5 1.5 0 0 1 -3 0v-2l.001 -.027a6 6 0 0 1 3.999 -10.473h2.5l4.5 -3h.001z"></path>
		</svg>
	</div>
	<div :class="$style.main">
		<div :class="$style.title">{{ i18n.ts.didYouLikeMisskey }}</div>
		<div :class="$style.text">
			<I18n :src="i18n.ts.pleaseDonate" tag="span">
				<template #host>
					{{ $instance.name ?? host }}
				</template>
			</I18n>
			<div style="margin-top: 0.2em;">
				<MkLink target="_blank" url="https://misskey-hub.net/docs/donate.html">{{ i18n.ts.learnMore }}</MkLink>
			</div>
		</div>
		<div class="_buttons">
			<MkButton @click="close">{{ i18n.ts.remindMeLater }}</MkButton>
			<MkButton @click="neverShow">{{ i18n.ts.neverShow }}</MkButton>
		</div>
	</div>
	<button class="_button" :class="$style.close" @click="close"><i class="ti ti-x"></i></button>
</div>
</template>

<script lang="ts" setup>
import MkButton from '@/components/MkButton.vue';
import MkLink from '@/components/MkLink.vue';
import { host } from '@/config';
import { i18n } from '@/i18n';
import * as os from '@/os';
import { miLocalStorage } from '@/local-storage';

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const zIndex = os.claimZIndex('low');

function close() {
	miLocalStorage.setItem('latestDonationInfoShownAt', Date.now().toString());
	emit('closed');
}

function neverShow() {
	miLocalStorage.setItem('neverShowDonationInfo', 'true');
	close();
}
</script>

<style lang="scss" module>
.root {
	position: fixed;
	z-index: v-bind(zIndex);
	bottom: var(--margin);
	left: 0;
	right: 0;
	margin: auto;
	box-sizing: border-box;
	width: calc(100% - (var(--margin) * 2));
	max-width: 500px;
	display: flex;
}

.icon {
	text-align: center;
	padding-top: 25px;
	width: 100px;
	color: var(--accent);
}
@media (max-width: 500px) {
	.icon {
		width: 80px;
	}
}
@media (max-width: 450px) {
	.icon {
		width: 70px;
	}
}

.main {
	padding: 25px 25px 25px 0;
	flex: 1;
}

.close {
	position: absolute;
	top: 8px;
	right: 8px;
	padding: 8px;
}

.title {
	font-weight: bold;
}

.text {
	margin: 0.7em 0 1em 0;
}
</style>
