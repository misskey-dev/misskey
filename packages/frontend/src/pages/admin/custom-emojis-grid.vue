<template>
<div>
	<MkStickyContainer>
		<template #header>
			<MkPageHeader/>
		</template>
		<div class="_gaps" :class="$style.root">
			<MkGrid :data="gridItems" :columnSettings="columnSettings"/>
		</div>
	</MkStickyContainer>
</div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { GridItem } from '@/pages/admin/custom-emojis-grid.impl.js';
import MkGrid from '@/components/grid/MkGrid.vue';
import { ColumnSetting } from '@/components/grid/types.js';

const columnSettings: ColumnSetting[] = [
	{ bindTo: 'url', title: ' ', type: 'image', width: 50 },
	{ bindTo: 'name', title: 'name', type: 'text', width: 140 },
	{ bindTo: 'category', title: 'category', type: 'text', width: 140 },
	{ bindTo: 'aliases', title: 'aliases', type: 'text', width: 140 },
	{ bindTo: 'license', title: 'license', type: 'text', width: 140 },
	{ bindTo: 'isSensitive', title: 'sensitive', type: 'text', width: 90 },
	{ bindTo: 'localOnly', title: 'localOnly', type: 'text', width: 90 },
	{ bindTo: 'roleIdsThatCanBeUsedThisEmojiAsReaction', title: 'role', type: 'text', width: 140 },
];

const customEmojis = ref<Misskey.entities.EmojiDetailed[]>([]);
const gridItems = ref<GridItem[]>([]);
// const convertedGridItems = computed<DataSource[]>(() => gridItems.value.map(it => it.asRecord()));

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
</style>
