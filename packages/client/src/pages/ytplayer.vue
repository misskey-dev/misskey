<template>
  <div class="poamfof fill">
      <transition :name="$store.state.animation ? 'fade' : ''" mode="out-in">
          <div v-if="player.url" class="player">
	          <iframe v-if="!fetching" :src="player.url + (player.url.match(/\?/) ? '&autoplay=1&auto_play=1' : '?autoplay=1&auto_play=1')" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen/>
          </div>
      </transition>
			<MkLoading v-if="fetching" />
      <MkError v-else-if="!player.url" @retry="fetch()" />
  </div>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { computed } from 'vue';
import { url as local, lang } from '@/config';

const props = defineProps<{
    url: string;
}>();

console.log(props.url);

const requestUrl = new URL(props.url);

let fetching = $ref(true);
let title = $ref<string | null>(null);
let description = $ref<string | null>(null);
let thumbnail = $ref<string | null>(null);
let icon = $ref<string | null>(null);
let sitename = $ref<string | null>(null);
let player = $ref({
    url: null,
    width: null,
    height: null,
});

const requestLang = (lang || 'ja-JP').replace('ja-KS', 'ja-JP');

fetch(`/url?url=${encodeURIComponent(requestUrl.href)}&lang=${requestLang}`).then(res => {
    res.json().then(info => {
        if (info.url == null) return;
        title = info.title;
        description = info.description;
        thumbnail = info.thumbnail;
        icon = info.icon;
        sitename = info.sitename;
        fetching = false;
        player = info.player;
    });
});

definePageMetadata(computed(() => props.url ? {
	title: title?.toString() || 'ytplayer',
	path: `/notes/${props.url}`,
	icon: 'fa-brands fa-youtube'
} : null));

console.log(await player.url);
</script>

<style lang="scss">
.fill {
	height: 100%;
}
.player {
	height: calc(100% - 10px);
	width: calc(100% - 10px);
	padding: 5px;

	>iframe {
		height: 100%;
		width: 100%;
		border-radius: 0 0 var(--radius) var(--radius);
		left: 0;
		top: 0;
	}
}
</style>
