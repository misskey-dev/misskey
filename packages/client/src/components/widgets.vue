<template>
<div class="vjoppmmu">
	<template v-if="edit">
		<header>
			<MkSelect v-model="widgetAdderSelected" style="margin-bottom: var(--margin)">
				<template #label>{{ $ts.selectWidget }}</template>
				<option v-for="widget in widgetDefs" :key="widget" :value="widget">{{ $t(`_widgets.${widget}`) }}</option>
			</MkSelect>
			<MkButton inline primary @click="addWidget"><i class="fas fa-plus"></i> {{ $ts.add }}</MkButton>
			<MkButton inline @click="$emit('exit')">{{ $ts.close }}</MkButton>
		</header>
		<XDraggable
			v-model="_widgets"
			item-key="id"
			animation="150"
		>
			<template #item="{element}">
				<div class="customize-container">
					<button class="config _button" @click.prevent.stop="configWidget(element.id)"><i class="fas fa-cog"></i></button>
					<button class="remove _button" @click.prevent.stop="removeWidget(element)"><i class="fas fa-times"></i></button>
					<component :is="`mkw-${element.name}`" :widget="element" :setting-callback="setting => settings[element.id] = setting" @updateProps="updateWidget(element.id, $event)"/>
				</div>
			</template>
		</XDraggable>
	</template>
	<component :is="`mkw-${widget.name}`" v-for="widget in widgets" v-else :key="widget.id" class="widget" :widget="widget" @updateProps="updateWidget(widget.id, $event)"/>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { v4 as uuid } from 'uuid';
import MkSelect from '@/components/form/select.vue';
import MkButton from '@/components/ui/button.vue';
import { widgets as widgetDefs } from '@/widgets';

export default defineComponent({
	components: {
		XDraggable: defineAsyncComponent(() => import('vuedraggable').then(x => x.default)),
		MkSelect,
		MkButton,
	},

	props: {
		widgets: {
			type: Array,
			required: true,
		},
		edit: {
			type: Boolean,
			required: true,
		},
	},

	emits: ['updateWidgets', 'addWidget', 'removeWidget', 'updateWidget', 'exit'],

	data() {
		return {
			widgetAdderSelected: null,
			widgetDefs,
			settings: {},
		};
	},

	computed: {
		_widgets: {
			get() {
				return this.widgets;
			},
			set(value) {
				this.$emit('updateWidgets', value);
			}
		}
	},

	methods: {
		configWidget(id) {
			this.settings[id]();
		},

		addWidget() {
			if (this.widgetAdderSelected == null) return;

			this.$emit('addWidget', {
				name: this.widgetAdderSelected,
				id: uuid(),
				data: {}
			});

			this.widgetAdderSelected = null;
		},

		removeWidget(widget) {
			this.$emit('removeWidget', widget);
		},

		updateWidget(id, data) {
			this.$emit('updateWidget', { id, data });
		},
	}
});
</script>

<style lang="scss" scoped>
.vjoppmmu {
	> header {
		margin: 16px 0;

		> * {
			width: 100%;
			padding: 4px;
		}
	}

	> .widget, .customize-container {
		margin: var(--margin) 0;

		&:first-of-type {
			margin-top: 0;
		}
	}

	.customize-container {
		position: relative;
		cursor: move;

		> *:not(.remove):not(.config) {
			pointer-events: none;
		}

		> .config,
		> .remove {
			position: absolute;
			z-index: 10000;
			top: 8px;
			width: 32px;
			height: 32px;
			color: #fff;
			background: rgba(#000, 0.7);
			border-radius: 4px;
		}

		> .config {
			right: 8px + 8px + 32px;
		}

		> .remove {
			right: 8px;
		}
	}
}
</style>
