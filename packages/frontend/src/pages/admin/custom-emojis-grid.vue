<template>
<div>
	<MkStickyContainer>
		<template #header>
			<MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/>
		</template>
		<div class="_gaps" :class="$style.root">
			<MkInput v-model="query" :debounce="true" type="search" autocapitalize="off">
				<template #prefix><i class="ti ti-search"></i></template>
				<template #label>{{ i18n.ts.search }}</template>
			</MkInput>

			<div :class="$style.controller">
				<MkSelect v-model="limit">
					<option value="100">100件</option>
				</MkSelect>
			</div>

			<div style="overflow-y: scroll; padding-top: 8px; padding-bottom: 8px;">
				<MkGrid :data="convertedGridItems" :columnSettings="columnSettings"/>
			</div>

			<div :class="$style.pages">
				<button>&lt;&lt;</button>
				<button>&lt;</button>

				<button>1</button>
				<button>2</button>
				<button>3</button>
				<button>4</button>
				<button>5</button>
				<span>...</span>
				<button>10</button>

				<button>&gt;</button>
				<button>&gt;&gt;</button>
			</div>
		</div>
	</MkStickyContainer>
</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { GridItem } from '@/pages/admin/custom-emojis-grid.impl.js';
import MkGrid from '@/components/grid/MkGrid.vue';
import { ColumnSetting } from '@/components/grid/types.js';
import { i18n } from '@/i18n.js';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const columnSettings: ColumnSetting[] = [
	{ bindTo: 'url', title: '🎨', type: 'image', editable: false, width: 50 },
	{ bindTo: 'name', title: 'name', type: 'text', editable: true, width: 140 },
	{ bindTo: 'category', title: 'category', type: 'text', editable: true, width: 140 },
	{ bindTo: 'aliases', title: 'aliases', type: 'text', editable: true, width: 140 },
	{ bindTo: 'license', title: 'license', type: 'text', editable: true, width: 140 },
	{ bindTo: 'isSensitive', title: 'sensitive', type: 'boolean', editable: true, width: 90 },
	{ bindTo: 'localOnly', title: 'localOnly', type: 'boolean', editable: true, width: 90 },
	{ bindTo: 'roleIdsThatCanBeUsedThisEmojiAsReaction', title: 'role', type: 'text', editable: true, width: 140 },
];

const customEmojis = ref<Misskey.entities.EmojiDetailed[]>([]);
const gridItems = ref<GridItem[]>([]);
const query = ref('');
const limit = ref(100);
const tab = ref('local');

const convertedGridItems = computed(() => gridItems.value.map(it => it.asRecord()));

const refreshCustomEmojis = async () => {
	customEmojis.value = await misskeyApi('emojis', { detail: true }).then(it => it.emojis);
};

const refreshGridItems = () => {
	gridItems.value = customEmojis.value.map(it => GridItem.ofEmojiDetailed(it));
};

watch(customEmojis, refreshGridItems);

onMounted(async () => {
	await refreshCustomEmojis();
	refreshGridItems();
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
	handler: () => {},
}, {
	icon: 'ti ti-dots',
	handler: () => {},
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
