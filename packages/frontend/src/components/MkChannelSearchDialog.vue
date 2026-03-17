<!--
SPDX-FileCopyrightText: hitalin and yamisskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="800"
	:height="600"
	@close="handleClose"
	@closed="$emit('closed')"
>
	<template #header>{{ title || i18n.ts.selectChannel }}</template>
	<div class="_gaps_m" style="padding: 24px;">
		<div class="_gaps">
			<MkInput v-model="searchQuery" :large="true" :autofocus="true" type="search" @enter="search">
				<template #prefix><i class="ti ti-search"></i></template>
			</MkInput>
			<MkRadios
				v-model="searchType" :options="[
					{ value: 'nameAndDescription', label: i18n.ts._channel.nameAndDescription },
					{ value: 'nameOnly', label: i18n.ts._channel.nameOnly },
				]" @update:modelValue="search()"
			/>
			<MkButton large primary gradate rounded @click="search">{{ i18n.ts.search }}</MkButton>
		</div>

		<MkFoldableSection v-if="searchResults.length > 0">
			<template #header>{{ i18n.ts.searchResult }}</template>
			<div :class="$style.channelGrid">
				<div
					v-for="channel in filteredResults"
					:key="channel.id"
					:class="$style.channelWrapper"
					@click.stop="selectChannel(channel)"
				>
					<div :class="$style.channelPreviewOverlay">
						<MkChannelPreview :channel="channel"/>
					</div>
				</div>
			</div>
		</MkFoldableSection>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkInput from '@/components/MkInput.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkButton from '@/components/MkButton.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkChannelPreview from '@/components/MkChannelPreview.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	title?: string;
	excludeIds?: string[];
}>();

const emit = defineEmits<{
	done: [result: Misskey.entities.Channel | undefined];
	closed: [];
}>();

const dialog = ref<InstanceType<typeof MkModalWindow>>();
const searchQuery = ref('');
const searchType = ref<'nameAndDescription' | 'nameOnly'>('nameAndDescription');
const searchResults = ref<Misskey.entities.Channel[]>([]);
const searchCompleted = ref(false);

const filteredResults = computed(() => {
	if (!props.excludeIds || props.excludeIds.length === 0) {
		return searchResults.value;
	}
	return searchResults.value.filter(channel => !props.excludeIds!.includes(channel.id));
});

async function search() {
	const query = searchQuery.value.toString().trim();
	const type = searchType.value.toString().trim();

	if (type !== 'nameAndDescription' && type !== 'nameOnly') {
		console.error(`Unrecognized search type: ${type}`);
		return;
	}

	try {
		const channels = await misskeyApi('channels/search', {
			query: query || '', // 空文字列でも検索を実行（全チャンネル取得）
			type: type,
			limit: 50,
		});

		searchResults.value = channels;
		searchCompleted.value = true;
	} catch (error) {
		console.error('Channel search failed:', error);
		searchResults.value = [];
		searchCompleted.value = true;
	}
}

function selectChannel(channel: Misskey.entities.Channel) {
	// チャンネルのデータが有効か確認
	if (!channel || !channel.id || !channel.name) {
		console.warn('Invalid channel data:', channel);
		return;
	}

	emit('done', channel);
	dialog.value?.close();
}

function handleClose() {
	// ダイアログが閉じられる際に何も選択されていなければundefinedを返す
	emit('done', undefined);
	dialog.value?.close();
}
</script>

<style lang="scss" module>
.channelGrid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 16px;
	padding: 16px 0;
}

.channelWrapper {
	cursor: pointer;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
	position: relative;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
}

.channelPreviewOverlay {
	pointer-events: none;
	position: relative;
}
</style>
