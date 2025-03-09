<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<XWidgets :edit="editMode" :widgets="widgets" @addWidget="addWidget" @removeWidget="removeWidget" @updateWidget="updateWidget" @updateWidgets="updateWidgets" @exit="editMode = false"/>

	<button v-if="editMode" class="_textButton" style="font-size: 0.9em;" @click="editMode = false"><i class="ti ti-check"></i> {{ i18n.ts.editWidgetsExit }}</button>
	<button v-else class="_textButton" data-cy-widget-edit :class="$style.edit" style="font-size: 0.9em;" @click="editMode = true"><i class="ti ti-pencil"></i> {{ i18n.ts.editWidgets }}</button>
</div>
</template>

<script lang="ts">
import { computed, ref } from 'vue';
const editMode = ref(false);
</script>
<script lang="ts" setup>
import XWidgets from '@/components/MkWidgets.vue';
import { i18n } from '@/i18n.js';
import { store } from '@/store.js';

const props = withDefaults(defineProps<{
	// null = 全てのウィジェットを表示
	// left = place: leftだけを表示
	// right = rightとnullを表示
	place?: 'left' | null | 'right';
}>(), {
	place: null,
});

const widgets = computed(() => {
	if (props.place === null) return store.reactiveState.widgets.value;
	if (props.place === 'left') return store.reactiveState.widgets.value.filter(w => w.place === 'left');
	return store.reactiveState.widgets.value.filter(w => w.place !== 'left');
});

function addWidget(widget) {
	store.set('widgets', [{
		...widget,
		place: props.place,
	}, ...store.state.widgets]);
}

function removeWidget(widget) {
	store.set('widgets', store.state.widgets.filter(w => w.id !== widget.id));
}

function updateWidget({ id, data }) {
	store.set('widgets', store.state.widgets.map(w => w.id === id ? {
		...w,
		data,
		place: props.place,
	} : w));
}

function updateWidgets(thisWidgets) {
	if (props.place === null) {
		store.set('widgets', thisWidgets);
		return;
	}
	if (props.place === 'left') {
		store.set('widgets', [
			...thisWidgets.map(w => ({ ...w, place: 'left' })),
			...store.state.widgets.filter(w => w.place !== 'left' && !thisWidgets.some(t => w.id === t.id)),
		]);
		return;
	}
	store.set('widgets', [
		...store.state.widgets.filter(w => w.place === 'left' && !thisWidgets.some(t => w.id === t.id)),
		...thisWidgets.map(w => ({ ...w, place: 'right' })),
	]);
}
</script>

<style lang="scss" module>
.edit {
	width: 100%;
}
</style>
