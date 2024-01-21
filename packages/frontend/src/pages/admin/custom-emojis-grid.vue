<template>
<div>
	<MkStickyContainer>
		<template #header>
			<MkPageHeader/>
		</template>
		<div class="_gaps" :class="$style.root">
			<AgGridVue
				:rowData="gridItems"
				:columnDefs="colDefs"
				:rowSelection="'multiple'"
				:rowClassRules="rowClassRules"
				style="height: 500px"
				class="ag-theme-quartz-auto-dark"
				@gridReady="onGridReady"
			>
			</AgGridVue>
		</div>
	</MkStickyContainer>
</div>
</template>

<script lang="ts">
import { markRaw, onMounted, ref, watch } from 'vue';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import * as Misskey from 'misskey-js';
import { AgGridVue } from 'ag-grid-vue3';
import { ColDef, GridApi, GridReadyEvent, RowClassRules } from 'ag-grid-community';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { GridItem } from '@/pages/admin/custom-emojis-grid.impl.js';
import CustomEmojisGridEmoji from '@/pages/admin/custom-emojis-grid-emoji.vue';

// eslint-disable-next-line import/no-default-export
export default {
	components: {
		AgGridVue,
		// eslint-disable-next-line vue/no-unused-components
		customEmojisGridEmoji: CustomEmojisGridEmoji,
	},
	setup() {
		const colDefs = markRaw<ColDef[]>([
			{
				field: 'img',
				headerName: '',
				initialWidth: 90,
				cellRenderer: 'customEmojisGridEmoji',
				checkboxSelection: true,
			},
			{ field: 'name', headerName: 'name', initialWidth: 140, editable: true },
			{ field: 'category', headerName: 'category', initialWidth: 140, editable: true },
			{ field: 'aliases', headerName: 'aliases', initialWidth: 140, editable: true },
			{ field: 'license', headerName: 'license', initialWidth: 140, editable: true },
			{ field: 'isSensitive', headerName: 'sensitive', initialWidth: 90, editable: true },
			{ field: 'localOnly', headerName: 'localOnly', initialWidth: 90, editable: true },
			{ field: 'roleIdsThatCanBeUsedThisEmojiAsReaction', headerName: 'role', initialWidth: 140, editable: true },
		]);

		const rowClassRules = markRaw<RowClassRules<GridItem>>({
			'emoji-grid-row-edited': params => params.data?.edited ?? false,
		});

		const gridApi = ref<GridApi>();
		const customEmojis = ref<Misskey.entities.EmojiDetailed[]>([]);
		const gridItems = ref<GridItem[]>([]);

		const refreshCustomEmojis = async () => {
			customEmojis.value = await misskeyApi('emojis', { detail: true }).then(it => it.emojis);
		};

		const refreshGridItems = () => {
			console.log(customEmojis.value);
			gridItems.value = customEmojis.value.map(it => GridItem.ofEmojiDetailed(it));
		};

		watch(customEmojis, refreshGridItems);

		onMounted(async () => {
			await refreshCustomEmojis();
			refreshGridItems();
		});

		function onGridReady(params: GridReadyEvent) {
			gridApi.value = params.api;
		}

		return {
			colDefs,
			rowClassRules,
			customEmojis,
			gridItems,
			onGridReady,
		};
	},
};
</script>

<style lang="scss">
.emoji-grid-row-edited {
	background-color: var(--ag-advanced-filter-column-pill-color);
}
</style>

<style module lang="scss">
.root {
	padding: 16px
}
</style>
