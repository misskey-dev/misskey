<template>
<MkA v-if="url.startsWith('/')" v-user-preview="canonical" class="ldlomzub" :class="{ isMe }" :to="url" :style="{ background: bg }">
	<img class="icon" :src="`/avatar/@${username}@${host}`" alt="">
	<span class="main">
		<span class="username">@{{ username }}</span>
		<span v-if="(host != localHost) || $store.state.showFullAcct" class="host">@{{ toUnicode(host) }}</span>
	</span>
</MkA>
<a v-else class="ldlomzub" :href="url" target="_blank" rel="noopener" :style="{ background: bg }">
	<span class="main">
		<span class="username">@{{ username }}</span>
		<span class="host">@{{ toUnicode(host) }}</span>
	</span>
</a>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as tinycolor from 'tinycolor2';
import { toUnicode } from 'punycode';
import { host as localHost } from '@/config';
import { $i } from '@/account';

export default defineComponent({
	props: {
		username: {
			type: String,
			required: true
		},
		host: {
			type: String,
			required: true
		}
	},

	setup(props) {
		const canonical = props.host === localHost ? `@${props.username}` : `@${props.username}@${toUnicode(props.host)}`;

		const url = `/${canonical}`;

		const isMe = $i && (
			`@${props.username}@${toUnicode(props.host)}` === `@${$i.username}@${toUnicode(localHost)}`.toLowerCase()
		);

		const bg = tinycolor(getComputedStyle(document.documentElement).getPropertyValue(isMe ? '--mentionMe' : '--mention'));
		bg.setAlpha(0.1);

		return {
			localHost,
			isMe,
			url,
			canonical,
			toUnicode,
			bg: bg.toRgbString(),
		};
	},
});
</script>

<style lang="scss" scoped>
.ldlomzub {
	display: inline-block;
	padding: 4px 8px 4px 4px;
	border-radius: 999px;
	color: var(--mention);

	&.isMe {
		color: var(--mentionMe);
	}

	> .icon {
		width: 1.5em;
		margin: 0 0.2em 0 0;
		vertical-align: bottom;
		border-radius: 100%;
	}

	> .main {
		> .host {
			opacity: 0.5;
		}
	}
}
</style>
