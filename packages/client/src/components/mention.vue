<template>
<MkA v-if="url.startsWith('/')" v-user-preview="canonical" :class="[$style.root, { isMe }]" :to="url" :style="{ background: bg }">
	<img :class="$style.icon" :src="`/avatar/@${username}@${host}`" alt="">
	<span class="main">
		<span class="username">@{{ username }}</span>
		<span v-if="(host != localHost) || $store.state.showFullAcct" :class="$style.mainHost">@{{ toUnicode(host) }}</span>
	</span>
</MkA>
<a v-else :class="$style.root" :href="url" target="_blank" rel="noopener" :style="{ background: bg }">
	<span class="main">
		<span class="username">@{{ username }}</span>
		<span :class="$style.mainHost">@{{ toUnicode(host) }}</span>
	</span>
</a>
</template>

<script lang="ts">
import { defineComponent, useCssModule } from 'vue';
import tinycolor from 'tinycolor2';
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

		useCssModule();

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

<style lang="scss" module>
.root {
	display: inline-block;
	padding: 4px 8px 4px 4px;
	border-radius: 999px;
	color: var(--mention);

	&.isMe {
		color: var(--mentionMe);
	}
}

.icon {
	width: 1.5em;
	height: 1.5em;
	object-fit: cover;
	margin: 0 0.2em 0 0;
	vertical-align: bottom;
	border-radius: 100%;
}

.mainHost {
	opacity: 0.5;
}
</style>
