<template>
<div class="qydbhufi">
	<XWidgets :edit="edit" :widgets="widgets" @add-widget="addWidget" @remove-widget="removeWidget" @update-widget="updateWidget" @update-widgets="updateWidgets" @exit="edit = false"/>

	<button v-if="edit" @click="edit = false" class="_textButton" style="font-size: 0.9em;">{{ $ts.editWidgetsExit }}</button>
	<button v-else @click="edit = true" class="_textButton" style="font-size: 0.9em;">{{ $ts.editWidgets }}</button>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import XWidgets from '@client/components/widgets.vue';
import { store } from './store';

export default defineComponent({
	components: {
		XWidgets,
	},

	data() {
		return {
			edit: false,
			widgets: store.reactiveState.widgets
		};
	},

	methods: {
		addWidget(widget) {
			store.set('widgets', [widget, ...store.state.widgets]);
		},

		removeWidget(widget) {
			store.set('widgets', store.state.widgets.filter(w => w.id != widget.id));
		},

		updateWidget({ id, data }) {
			// TODO: throttleしたい
			store.set('widgets', store.state.widgets.map(w => w.id === id ? {
				...w,
				data: data
			} : w));
		},

		updateWidgets(widgets) {
			store.set('widgets', widgets);
		}
	}
});
</script>

<style lang="scss" scoped>
.qydbhufi {
	height: 100%;
	box-sizing: border-box;
	overflow: auto;
	padding: var(--margin);

	::v-deep(._panel) {
		box-shadow: none;
	}
}
</style>
