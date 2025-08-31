<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkCustomEmoji v-if="reaction[0] === ':'" ref="elRef" :name="reaction" :normal="true" :noStyle="noStyle" :url="emojiUrl" :fallbackToImage="true"/>
<MkEmoji v-else ref="elRef" :emoji="reaction" :normal="true" :noStyle="noStyle"/>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, useTemplateRef } from 'vue';
import { useTooltip } from '@/composables/use-tooltip.js';
import * as os from '@/os.js';

const props = defineProps<{
	reaction: string;
	noStyle?: boolean;
	emojiUrl?: string;
	withTooltip?: boolean;
}>();

const elRef = useTemplateRef('elRef');

if (props.withTooltip) {
	useTooltip(elRef, (showing) => {
		if (elRef.value == null) return;
		const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkReactionTooltip.vue')), {
			showing,
			reaction: props.reaction.replace(/^:(\w+):$/, ':$1@.:'),
			anchorElement: elRef.value.$el,
		}, {
			closed: () => dispose(),
		});
	});
}
</script>
