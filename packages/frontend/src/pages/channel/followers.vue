<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 1000px;">
		<Transition name="fade" mode="out-in">
			<div v-if="channel">
				<XFollowersList :channelId="channel.id"/>
			</div>
			<MkError v-else-if="error" @retry="fetchChannel()"/>
			<MkLoading v-else/>
		</Transition>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XFollowersList from './followers-list.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';

const props = withDefaults(defineProps<{
	channelId: string;
}>(), {
});

const channel = ref<null | Misskey.entities.Channel>(null);
const error = ref<any>(null);

function fetchChannel(): void {
	if (props.channelId == null) return;
	channel.value = null;
	misskeyApi('channels/show', { channelId: props.channelId }).then(c => {
		channel.value = c;
	}).catch(err => {
		error.value = err;
	});
}

watch(() => props.channelId, fetchChannel, {
	immediate: true,
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.channel,
	icon: 'ti ti-device-tv',
	...channel.value ? {
		title: channel.value.name,
		subtitle: i18n.ts.followers,
	} : {},
}));
</script>
