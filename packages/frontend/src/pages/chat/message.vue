<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<MkSpacer :contentMax="700">
		<div v-if="initializing">
			<MkLoading/>
		</div>
		<div v-else>
			<XMessage :message="message"/>
		</div>
	</MkSpacer>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef, computed, watch, onMounted, nextTick, onBeforeUnmount, onDeactivated, onActivated } from 'vue';
import * as Misskey from 'misskey-js';
import XMessage from './XMessage.vue';
import * as os from '@/os.js';
import { useStream } from '@/stream.js';
import { i18n } from '@/i18n.js';
import { ensureSignin } from '@/i.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import MkButton from '@/components/MkButton.vue';

const props = defineProps<{
	messageId?: string;
}>();

const initializing = ref(true);
const message = ref<Misskey.entities.ChatMessage>();

async function initialize() {
	initializing.value = true;

	message.value = await misskeyApi('chat/messages/show', {
		messageId: props.messageId,
	});

	initializing.value = false;
}

onMounted(() => {
	initialize();
});

definePage({
	title: i18n.ts.chat,
});
</script>
