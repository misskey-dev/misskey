<template>
<div class="efzpzdvf">
	<XWidgets class="widgets" :edit="editMode" :widgets="$store.reactiveState.widgets.value" @add-widget="addWidget" @remove-widget="removeWidget" @update-widget="updateWidget" @update-widgets="updateWidgets" @exit="editMode = false"/>
	<MkAd prefer="square"/>

	<button v-if="editMode" @click="editMode = false" class="_textButton edit" style="font-size: 0.9em;"><i class="fas fa-check"></i> {{ $ts.editWidgetsExit }}</button>
	<button v-else @click="editMode = true" class="_textButton edit" style="font-size: 0.9em;"><i class="fas fa-pencil-alt"></i> {{ $ts.editWidgets }}</button>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import XWidgets from '@client/components/widgets.vue';
import * as os from '@client/os';

export default defineComponent({
	components: {
		XWidgets
	},

	emits: ['mounted'],

	data() {
		return {
			editMode: false,
		};
	},

	mounted() {
		this.$emit('mounted', this.$el);
	},

	methods: {
		addWidget(widget) {
			this.$store.set('widgets', [{
				...widget,
				place: null,
			}, ...this.$store.state.widgets]);
		},

		removeWidget(widget) {
			this.$store.set('widgets', this.$store.state.widgets.filter(w => w.id != widget.id));
		},

		updateWidget({ id, data }) {
			this.$store.set('widgets', this.$store.state.widgets.map(w => w.id === id ? {
				...w,
				data: data
			} : w));
		},

		updateWidgets(widgets) {
			this.$store.set('widgets', widgets);
		}
	}
});
</script>

<style lang="scss" scoped>
.efzpzdvf {
	position: sticky;
	height: min-content;
	box-sizing: border-box;
	padding-bottom: 8px;

	> .widgets {
		width: 300px;
	}

	> .edit {
		display: block;
		margin: 16px auto;
	}
}
</style>
