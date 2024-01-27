<template>
<div class="_gaps">
	<MkInput :modelValue="query" :debounce="true" type="search" autocapitalize="off" @change="(v) => query = v">
		<template #prefix><i class="ti ti-search"></i></template>
		<template #label>{{ i18n.ts.search }}</template>
	</MkInput>

	<div
		style="overflow-y: scroll; padding-top: 8px; padding-bottom: 8px;"
	>
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
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, ref, toRefs, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { GridItem } from '@/pages/admin/custom-emojis-grid.impl.js';
import MkGrid from '@/components/grid/MkGrid.vue';
import { ColumnSetting } from '@/components/grid/types.js';
import { i18n } from '@/i18n.js';
import MkInput from '@/components/MkInput.vue';

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

const props = defineProps<{
	customEmojis: Misskey.entities.EmojiDetailed[];
}>();

const { customEmojis } = toRefs(props);

const query = ref('');
const gridItems = ref<GridItem[]>([]);

const convertedGridItems = computed(() => gridItems.value.map(it => it.asRecord()));

watch(customEmojis, refreshGridItems);

function refreshGridItems() {
	gridItems.value = customEmojis.value.map(it => GridItem.fromEmojiDetailed(it));
}

refreshGridItems();

</script>

<style module lang="scss">

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
