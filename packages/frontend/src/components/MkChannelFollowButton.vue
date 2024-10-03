<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<button
	class="_button"
	:class="[$style.root, { [$style.wait]: wait, [$style.active]: isFollowing, [$style.full]: full }]"
	:disabled="wait"
	@click="onClick"
>
	<template v-if="!wait">
		<template v-if="isFollowing">
			<span v-if="full" :class="$style.text">{{ i18n.ts.unfollow }}</span><i class="ti ti-minus"></i>
		</template>
		<template v-else>
			<span v-if="full" :class="$style.text">{{ i18n.ts.follow }}</span><i class="ti ti-plus"></i>
		</template>
	</template>
	<template v-else>
		<span v-if="full" :class="$style.text">{{ i18n.ts.processing }}</span><MkLoading :em="true"/>
	</template>
</button>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';

const props = withDefaults(defineProps<{
	channel: Misskey.entities.Channel;
	full?: boolean;
}>(), {
	full: false,
});

const isFollowing = ref(props.channel.isFollowing);
const wait = ref(false);

async function onClick() {
	wait.value = true;

	try {
		if (isFollowing.value) {
			await misskeyApi('channels/unfollow', {
				channelId: props.channel.id,
			});
			isFollowing.value = false;
		} else {
			await misskeyApi('channels/follow', {
				channelId: props.channel.id,
			});
			isFollowing.value = true;
		}
	} catch (err) {
		console.error(err);
	} finally {
		wait.value = false;
	}
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: inline-block;
	font-weight: bold;
	color: var(--accent);
	background: transparent;
	border: solid 1px var(--accent);
	padding: 0;
	height: 31px;
	font-size: 16px;
	border-radius: 32px;
	background: #fff;

	&.full {
		padding: 0 8px 0 12px;
		font-size: 14px;
	}

	&:not(.full) {
		width: 31px;
	}

	&:focus-visible {
		outline-offset: 2px;
	}

	&:hover {
		//background: mix($primary, #fff, 20);
	}

	&:active {
		//background: mix($primary, #fff, 40);
	}

	&.active {
		color: var(--fgOnAccent);
		background: var(--accent);

		&:hover {
			background: var(--accentLighten);
			border-color: var(--accentLighten);
		}

		&:active {
			background: var(--accentDarken);
			border-color: var(--accentDarken);
		}
	}

	&.wait {
		cursor: wait !important;
		opacity: 0.7;
	}
}

.text {
	margin-right: 6px;
}
</style>
