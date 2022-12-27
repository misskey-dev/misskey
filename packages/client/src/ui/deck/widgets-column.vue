<template>
<XColumn :menu="menu" :naked="true" :column="column" :is-stacked="isStacked" @parent-focus="$event => emit('parent-focus', $event)">
	<template #header><i class="ti ti-apps" style="margin-right: 8px;"></i>{{ column.name }}</template>

	<div class="wtdtxvec">
		<div v-if="!(column.widgets && column.widgets.length > 0) && !edit" class="intro">{{ i18n.ts._deck.widgetsIntroduction }}</div>
		<XWidgets :edit="edit" :widgets="column.widgets" @add-widget="addWidget" @remove-widget="removeWidget" @update-widget="updateWidget" @update-widgets="updateWidgets" @exit="edit = false"/>
	</div>
</XColumn>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XColumn from './column.vue';
import { addColumnWidget, Column, removeColumnWidget, setColumnWidgets, updateColumnWidget } from './deck-store';
import XWidgets from '@/components/MkWidgets.vue';
import { i18n } from '@/i18n';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const emit = defineEmits<{
	(ev: 'parent-focus', direction: 'up' | 'down' | 'left' | 'right'): void;
}>();

let edit = $ref(false);

function addWidget(widget) {
	addColumnWidget(props.column.id, widget);
}

function removeWidget(widget) {
	removeColumnWidget(props.column.id, widget);
}

function updateWidget({ id, data }) {
	updateColumnWidget(props.column.id, id, data);
}

function updateWidgets(widgets) {
	setColumnWidgets(props.column.id, widgets);
}

function func() {
	edit = !edit;
}

const menu = [{
	icon: 'ti ti-pencil',
	text: i18n.ts.editWidgets,
	action: func,
}];
</script>

<style lang="scss" scoped>
.wtdtxvec {
	--margin: 8px;
	--panelBorder: none;

	padding: 0 var(--margin);

	> .intro {
		padding: 16px;
		text-align: center;
	}
}
</style>
