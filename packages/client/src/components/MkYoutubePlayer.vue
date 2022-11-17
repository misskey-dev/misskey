<template>
<XWindow :initial-width="640" :initial-height="402" :can-resize="true" :close-button="true">
	<template #header>
		<i class="icon fa-brands fa-youtube" style="margin-right: 0.5em;"></i>
		<span>{{ title ?? 'YouTube Player' }}</span>
	</template>

	<div class="poamfof">
		<transition :name="$store.state.animation ? 'fade' : ''" mode="out-in">
			<div v-if="player.url" class="player">
				<iframe v-if="!fetching" :src="player.url + (player.url.match(/\?/) ? '&autoplay=1&auto_play=1' : '?autoplay=1&auto_play=1')" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen/>
			</div>
		</transition>
		<MkLoading v-if="fetching"/>
		<MkError v-else-if="!player.url" @retry="ytFetch()"/>
	</div>
</XWindow>
</template>

<script lang="ts" setup>
import XWindow from '@/components/MkWindow.vue';
import { lang } from '@/config';

const props = defineProps<{
	url: string;
}>();

const requestUrl = new URL(props.url);

let fetching = $ref(true);
let title = $ref<string | null>(null);
let player = $ref({
	url: null,
	width: null,
	height: null,
});

const requestLang = (lang ?? 'ja-JP').replace('ja-KS', 'ja-JP');

const ytFetch = (): void => {
	fetching = true;
	fetch(`/url?url=${encodeURIComponent(requestUrl.href)}&lang=${requestLang}`).then(res => {
		res.json().then(info => {
			if (info.url == null) return;
			title = info.title;
			fetching = false;
			player = info.player;
		});
	});
};

ytFetch();

</script>

<style lang="scss">
.poamfof {
	position: relative;
	overflow: hidden;
	height: 100%;

	.player {
		position: absolute;
		inset: 0;

		iframe {
			width: 100%;
			height: 100%;
		}
	}
}
</style>
