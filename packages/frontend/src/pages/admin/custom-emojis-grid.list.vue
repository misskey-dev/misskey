<template>
<div class="_gaps">
	<div :class="$style.searchArea">
		<MkInput v-model="query" :debounce="true" type="search" autocapitalize="off" style="flex: 1">
			<template #prefix><i class="ti ti-search"></i></template>
		</MkInput>
		<MkButton primary style="margin-left: auto;" @click="onSearchButtonClicked">
			{{ i18n.ts.search }}
		</MkButton>
	</div>

	<div
		style="overflow-y: scroll; padding-top: 8px; padding-bottom: 8px;"
	>
		<MkGrid :data="convertedGridItems" :columnSettings="columnSettings"/>
	</div>

	<div class="_gaps">
		<div :class="$style.pages">
			<button>&lt;</button>
			<button>&gt;</button>
		</div>

		<div :class="$style.buttons">
			<MkButton primary>{{ i18n.ts.update }}</MkButton>
			<MkButton>リセット</MkButton>
		</div>
	</div>
</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRefs, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { fromEmojiDetailed, GridItem } from '@/pages/admin/custom-emojis-grid.impl.js';
import MkGrid from '@/components/grid/MkGrid.vue';
import { ColumnSetting } from '@/components/grid/grid.js';
import { i18n } from '@/i18n.js';
import MkInput from '@/components/MkInput.vue';
import { required } from '@/components/grid/cell-validators.js';
import MkButton from '@/components/MkButton.vue';

const columnSettings: ColumnSetting[] = [
	{ bindTo: 'selected', icon: 'ti-trash', type: 'boolean', editable: true, width: 34 },
	{ bindTo: 'url', icon: 'ti-icons', type: 'image', editable: false, width: 'auto', validators: [required] },
	{ bindTo: 'name', title: 'name', type: 'text', editable: true, width: 140, validators: [required] },
	{ bindTo: 'category', title: 'category', type: 'text', editable: true, width: 140 },
	{ bindTo: 'aliases', title: 'aliases', type: 'text', editable: true, width: 140 },
	{ bindTo: 'license', title: 'license', type: 'text', editable: true, width: 140 },
	{ bindTo: 'isSensitive', title: 'sensitive', type: 'boolean', editable: true, width: 90 },
	{ bindTo: 'localOnly', title: 'localOnly', type: 'boolean', editable: true, width: 90 },
	{ bindTo: 'roleIdsThatCanBeUsedThisEmojiAsReaction', title: 'role', type: 'text', editable: true, width: 140 },
];

const emit = defineEmits<{
	(ev: 'operation:search', query: string, sinceId?: string, untilId?: string): void;
}>();

const props = defineProps<{
	customEmojis: Misskey.entities.EmojiDetailed[];
}>();

const { customEmojis } = toRefs(props);

const query = ref('');
const gridItems = ref<GridItem[]>([]);

const convertedGridItems = computed(() => gridItems.value.map(it => it as Record<string, any>));

watch(customEmojis, refreshGridItems);

function onSearchButtonClicked() {
	emit('operation:search', query.value, undefined, undefined);
}

function refreshGridItems() {
	gridItems.value = customEmojis.value.map(it => fromEmojiDetailed(it));
}

onMounted(() => {
	refreshGridItems();
});

</script>

<style module lang="scss">
.searchArea {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: stretch;
	gap: 8px;
}

.pages {
	display: flex;
	justify-content: center;
	align-items: center;

	button {
		background-color: var(--buttonBg);
		border-radius: 9999px;
		border: none;
		margin: 0 4px;
		padding: 8px;
	}
}

.buttons {
	display: inline-flex;
	margin-left: auto;
	gap: 8px;
	flex-wrap: wrap;
}

</style>
