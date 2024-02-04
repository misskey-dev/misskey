<template>
<div>
	<MkStickyContainer>
		<template #header>
			<MkPageHeader v-model:tab="headerTab" :actions="headerActions" :tabs="headerTabs"/>
		</template>
		<div class="_gaps" :class="$style.root">
			<MkTab v-model="modeTab" style="margin-bottom: var(--margin);">
				<option value="list">登録済み絵文字一覧</option>
				<option value="register">新規登録</option>
			</MkTab>

			<div>
				<XListComponent
					v-if="modeTab === 'list'"
					:customEmojis="customEmojis"
					@operation:search="onOperationSearch"
				/>
				<XRegisterComponent
					v-else
					@operation:registered="onOperationRegistered"
				/>
			</div>
		</div>
	</MkStickyContainer>
</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import * as os from '@/os.js';
import MkTab from '@/components/MkTab.vue';
import XListComponent from '@/pages/admin/custom-emojis-grid.list.vue';
import XRegisterComponent from '@/pages/admin/custom-emojis-grid.register.vue';

type PageMode = 'list' | 'register';

const customEmojis = ref<Misskey.entities.EmojiDetailed[]>([]);
const headerTab = ref('local');
const modeTab = ref<PageMode>('list');
const query = ref<string>();

async function refreshCustomEmojis(query?: string, sinceId?: string, untilId?: string) {
	const emojis = await misskeyApi('admin/emoji/list', {
		limit: 100,
		query,
		sinceId,
		untilId,
	});

	if (sinceId) {
		// 通常はID降順だが、sinceIdを設定すると昇順での並び替えとなるので、逆順にする必要がある
		emojis.reverse();
	}

	customEmojis.value = emojis;
}

async function onOperationSearch(q: string, sinceId?: string, untilId?: string) {
	query.value = q;
	await refreshCustomEmojis(q, sinceId, untilId);
}

async function onOperationRegistered() {
	await refreshCustomEmojis(query.value);
}

onMounted(async () => {
	await refreshCustomEmojis();
});

const headerTabs = computed(() => [{
	key: 'local',
	title: i18n.ts.local,
}, {
	key: 'remote',
	title: i18n.ts.remote,
}]);

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: i18n.ts.addEmoji,
	handler: () => {
	},
}, {
	icon: 'ti ti-dots',
	text: '',
	handler: () => {
	},
}]);

definePageMetadata(computed(() => ({
	title: i18n.ts.customEmojis,
	icon: 'ti ti-icons',
})));
</script>

<style lang="scss">
.emoji-grid-row-edited {
	background-color: var(--ag-advanced-filter-column-pill-color);
}

.emoji-grid-item-image {
	width: auto;
	height: 26px;
	max-width: 100%;
	max-height: 100%;
}
</style>

<style module lang="scss">
.root {
	padding: 16px;
	overflow: scroll;
}

.controller {
	display: flex;
	justify-content: flex-start;
	align-items: center;
	margin-top: 16px;
}

.pages {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-top: 8px;

	button {
		background-color: var(--buttonBg);
		border-radius: 9999px;
		border: none;
		margin: 0 4px;
		padding: 8px;
	}
}
</style>
