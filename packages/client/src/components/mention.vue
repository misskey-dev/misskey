<template>
<MkA v-if="url.startsWith('/')" v-user-preview="canonical" class="akbvjaqn" :class="{ isMe }" :to="url" :style="{ background: bgCss }">
	<img class="icon" :src="`/avatar/@${username}@${host}`" alt="">
	<span class="main">
		<span class="username">@{{ username }}</span>
		<span v-if="(host != localHost) || $store.state.showFullAcct" class="host">@{{ toUnicode(host) }}</span>
	</span>
</MkA>
<a v-else class="akbvjaqn" :href="url" target="_blank" rel="noopener" :style="{ background: bgCss }">
	<span class="main">
		<span class="username">@{{ username }}</span>
		<span class="host">@{{ toUnicode(host) }}</span>
	</span>
</a>
</template>

<script lang="ts" setup>
import { toUnicode } from 'punycode';
import { useCssModule } from 'vue';
import tinycolor from 'tinycolor2';
import { host as localHost } from '@/config';
import { $i } from '@/account';

const props = defineProps<{
	username: string;
	host: string;
}>();

const canonical = props.host === localHost ? `@${props.username}` : `@${props.username}@${toUnicode(props.host)}`;

const url = `/${canonical}`;

const isMe = $i && (
	`@${props.username}@${toUnicode(props.host)}` === `@${$i.username}@${toUnicode(localHost)}`.toLowerCase()
);

const bg = tinycolor(getComputedStyle(document.documentElement).getPropertyValue(isMe ? '--mentionMe' : '--mention'));
bg.setAlpha(0.1);
const bgCss = bg.toRgbString();

useCssModule();
</script>

<style lang="scss" scoped>
.akbvjaqn {
	display: inline-block;
	padding: 4px 8px 4px 4px;
	border-radius: 999px;
	color: var(--mention);

	&.isMe {
		color: var(--mentionMe);
	}

	> .icon {
		width: 1.5em;
		height: 1.5em;
		object-fit: cover;
		margin: 0 0.2em 0 0;
		vertical-align: bottom;
		border-radius: 100%;
	}

	> .main > .host {
		opacity: 0.5;
	}
}
</style>
