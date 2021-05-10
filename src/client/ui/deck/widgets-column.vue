<template>
<XColumn :func="{ handler: func, title: $ts.editWidgets }" :naked="true" :column="column" :is-stacked="isStacked">
	<template #header><i class="fas fa-window-maximize" style="margin-right: 8px;"></i>{{ column.name }}</template>

	<div class="wtdtxvec">
		<XWidgets :edit="edit" :widgets="column.widgets" @add-widget="addWidget" @remove-widget="removeWidget" @update-widget="updateWidget" @update-widgets="updateWidgets" @exit="edit = false"/>
	</div>
</XColumn>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import XWidgets from '@client/components/widgets.vue';
import XColumn from './column.vue';
import { addColumnWidget, removeColumnWidget, setColumnWidgets, updateColumnWidget } from './deck-store';

export default defineComponent({
	components: {
		XColumn,
		XWidgets,
	},

	props: {
		column: {
			type: Object,
			required: true,
		},
		isStacked: {
			type: Boolean,
			required: true,
		},
	},

	data() {
		return {
			edit: false,
		};
	},

	methods: {
		addWidget(widget) {
			addColumnWidget(this.column.id, widget);
		},

		removeWidget(widget) {
			removeColumnWidget(this.column.id, widget);
		},

		updateWidget({ id, data }) {
			updateColumnWidget(this.column.id, id, data);
		},

		updateWidgets(widgets) {
			setColumnWidgets(this.column.id, widgets);
		},

		func() {
			this.edit = !this.edit;
		}
	}
});
</script>

<style lang="scss" scoped>
.wtdtxvec {
	--margin: 8px;
	--panelShadow: none;

	padding: 0 var(--margin);
}
</style>
