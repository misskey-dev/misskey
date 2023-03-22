<template>
<span v-if="!link" v-user-preview="preview ? user.id : undefined" class="_noSelect" :class="[$style.root, { [$style.cat]: user.isCat, [$style.square]: squareAvatars }]" :style="{ color }" :title="acct(user)" @click="onClick">
	<img :class="$style.inner" :src="url" decoding="async"/>
	<MkUserOnlineIndicator v-if="indicator" :class="$style.indicator" :user="user"/>
	<template v-if="user.isCat">
		<div :class="$style.earLeft"/>
		<div :class="$style.earRight"/>
	</template>
</span>
<MkA v-else v-user-preview="preview ? user.id : undefined" class="_noSelect" :class="[$style.root, { [$style.cat]: user.isCat, [$style.square]: squareAvatars }]" :style="{ color }" :title="acct(user)" :to="userPage(user)" :target="target">
	<img :class="$style.inner" :src="url" decoding="async"/>
	<MkUserOnlineIndicator v-if="indicator" :class="$style.indicator" :user="user"/>
	<template v-if="user.isCat">
		<div :class="$style.earLeft"/>
		<div :class="$style.earRight"/>
	</template>
</MkA>
</template>

<script lang="ts" setup>
import { watch } from 'vue';
import * as misskey from 'misskey-js';
import { getStaticImageUrl } from '@/scripts/media-proxy';
import { extractAvgColorFromBlurhash } from '@/scripts/extract-avg-color-from-blurhash';
import { acct, userPage } from '@/filters/user';
import MkUserOnlineIndicator from '@/components/MkUserOnlineIndicator.vue';
import { defaultStore } from '@/store';

const squareAvatars = $ref(defaultStore.state.squareAvatars);

const props = withDefaults(defineProps<{
	user: misskey.entities.User;
	target?: string | null;
	link?: boolean;
	preview?: boolean;
	indicator?: boolean;
}>(), {
	target: null,
	link: false,
	preview: false,
	indicator: false,
});

const emit = defineEmits<{
	(ev: 'click', v: MouseEvent): void;
}>();

const url = $computed(() => defaultStore.state.disableShowingAnimatedImages
	? getStaticImageUrl(props.user.avatarUrl)
	: props.user.avatarUrl);

function onClick(ev: MouseEvent) {
	emit('click', ev);
}

let color = $ref();

watch(() => props.user.avatarBlurhash, () => {
	color = extractAvgColorFromBlurhash(props.user.avatarBlurhash);
}, {
	immediate: true,
});
</script>

<style lang="scss" module>
@keyframes earwiggleleft {
	from { transform: rotate(37.6deg) skew(30deg); }
	25% { transform: rotate(10deg) skew(30deg); }
	50% { transform: rotate(20deg) skew(30deg); }
	75% { transform: rotate(0deg) skew(30deg); }
	to { transform: rotate(37.6deg) skew(30deg); }
}

@keyframes earwiggleright {
	from { transform: rotate(-37.6deg) skew(-30deg); }
	30% { transform: rotate(-10deg) skew(-30deg); }
	55% { transform: rotate(-20deg) skew(-30deg); }
	75% { transform: rotate(0deg) skew(-30deg); }
	to { transform: rotate(-37.6deg) skew(-30deg); }
}

.root {
	position: relative;
	display: inline-block;
	vertical-align: bottom;
	flex-shrink: 0;
	border-radius: 100%;
	line-height: 16px;
}

.inner {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	top: 0;
	border-radius: 100%;
	z-index: 1;
	overflow: clip;
	object-fit: cover;
	width: 100%;
	height: 100%;
}

.indicator {
	position: absolute;
	z-index: 1;
	bottom: 0;
	left: 0;
	width: 20%;
	height: 20%;
}

.square {
	border-radius: 20%;

	> .inner {
		border-radius: 20%;
	}
}

.cat {
	> .earLeft,
	> .earRight {
		contain: strict;
		display: inline-block;
		height: 50%;
		width: 50%;
		background: currentColor;

		&::before {
			contain: strict;
			content: '';
			display: block;
			width: 60%;
			height: 60%;
			margin: 20%;
			background: #df548f;
		}
	}

	> .earLeft {
		border-radius: 0 75% 75%;
		transform: rotate(37.5deg) skew(30deg);
	}

	> .earRight {
		border-radius: 75% 0 75% 75%;
		transform: rotate(-37.5deg) skew(-30deg);
	}

	&:hover {
		> .earLeft {
			animation: earwiggleleft 1s infinite;
		}

		> .earRight {
			animation: earwiggleright 1s infinite;
		}
	}
}
</style>
