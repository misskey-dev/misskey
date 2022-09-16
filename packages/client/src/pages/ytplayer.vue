<template>
  <div class="poamfof fill">
      <transition :name="$store.state.animation ? 'fade' : ''" mode="out-in">
          <div v-if="player.url" class="player">
	          <iframe v-if="!fetching" :src="player.url + (player.url.match(/\?/) ? '&autoplay=1&auto_play=1' : '?autoplay=1&auto_play=1')" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen/>
          </div>
      </transition>
			<MkLoading v-if="fetching" />
      <MkError v-else-if="!player.url" @retry="ytFetch()" />
  </div>
</template>

<script lang="ts" setup>
import { definePageMetadata } from '@/scripts/page-metadata';
import { computed } from 'vue';
import { lang } from '@/config';

const props = defineProps<{
    url: string;
}>();

console.log(props.url);

const requestUrl = new URL(props.url);

let fetching = $ref(true);
let title = $ref<string | null>(null);
let player = $ref({
    url: null,
    width: null,
    height: null,
});

const requestLang = (lang || 'ja-JP').replace('ja-KS', 'ja-JP');

const ytFetch = () => {
	fetching = true;
	fetch(`/url?url=${encodeURIComponent(requestUrl.href)}&lang=${requestLang}`).then(res => {
		res.json().then(info => {
			if (info.url == null) return;
			title = info.title;
			fetching = false;
			player = info.player;
		});
	});
}

ytFetch();

definePageMetadata(computed(() => props.url ? {
	title: title?.toString() || 'Youtube Player',
	path: `/notes/${props.url}`,
	icon: 'fa-brands fa-youtube'
} : null));

console.log(await player.url);
</script>

<style lang="scss">
.poamfof {
	position: relative;
	overflow: hidden;
	min-height: 64px;

	.player {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		height: calc(100% - 10px);
		width: calc(100% - 10px);
		padding: 5px;

		iframe {
			width: 100%;
			height: 100%;
			border-radius: 0 0 var(--radius) var(--radius);
		}
	}
}

.fill {
	height: 100%;
}
</style>
