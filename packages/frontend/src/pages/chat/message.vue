<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div v-if="initializing || message == null">
			<MkLoading/>
		</div>
		<div v-else>
			<XMessage :message="message" :isSearchResult="true"/>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import XMessage from './XMessage.vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';

const props = defineProps<{
	messageId: string;
}>();

const initializing = ref(true);
const message = ref<Misskey.entities.ChatMessage | null>();

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
	title: i18n.ts.directMessage,
});
</script>
