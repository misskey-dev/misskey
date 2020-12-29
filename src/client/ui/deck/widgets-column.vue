<template>
<XColumn :func="{ handler: func, title: $ts.editWidgets }" :naked="true" :column="column" :is-stacked="isStacked">
	<template #header><Fa :icon="faWindowMaximize" style="margin-right: 8px;"/>{{ column.name }}</template>

	<div class="wtdtxvec">
		<template v-if="edit">
			<header>
				<MkSelect v-model:value="widgetAdderSelected" style="margin-bottom: var(--margin)">
					<template #label>{{ $ts.selectWidget }}</template>
					<option v-for="widget in widgets" :value="widget" :key="widget">{{ $t(`_widgets.${widget}`) }}</option>
				</MkSelect>
				<MkButton inline @click="addWidget" primary><Fa :icon="faPlus"/> {{ $ts.add }}</MkButton>
				<MkButton inline @click="edit = false">{{ $ts.close }}</MkButton>
			</header>
			<XDraggable
				v-model="_widgets"
				item-key="id"
				animation="150"
			>
				<template #item="{element}">
					<div class="customize-container" @click="widgetFunc(element.id)">
						<button class="remove _button" @click.prevent.stop="removeWidget(element)"><Fa :icon="faTimes"/></button>
						<component :is="`mkw-${element.name}`" :widget="element" :setting-callback="setting => settings[element.id] = setting" :column="column" @updateProps="saveWidget(element.id, $event)"/>
					</div>
				</template>
			</XDraggable>
		</template>
		<component v-else class="widget" v-for="widget in column.widgets" :is="`mkw-${widget.name}`" :key="widget.id" :widget="widget" :column="column" @updateProps="saveWidget(widget.id, $event)"/>
	</div>
</XColumn>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { v4 as uuid } from 'uuid';
import { faWindowMaximize, faTimes, faCog, faPlus } from '@fortawesome/free-solid-svg-icons';
import MkSelect from '@/components/ui/select.vue';
import MkButton from '@/components/ui/button.vue';
import XColumn from './column.vue';
import { widgets } from '../../widgets';
import { addColumnWidget, removeColumnWidget, setColumnWidgets, updateColumnWidget } from './deck-store';

export default defineComponent({
	components: {
		XColumn,
		XDraggable: defineAsyncComponent(() => import('vuedraggable').then(x => x.default)),
		MkSelect,
		MkButton,
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
			widgetAdderSelected: null,
			widgets,
			settings: {},
			faWindowMaximize, faTimes, faPlus
		};
	},

	computed: {
		_widgets: {
			get() {
				return this.column.widgets;
			},
			set(value) {
				setColumnWidgets(this.column.id, value);
			}
		}
	},

	methods: {
		widgetFunc(id) {
			this.settings[id]();
		},

		addWidget() {
			if (this.widgetAdderSelected == null) return;

			addColumnWidget(this.column.id, {
				name: this.widgetAdderSelected,
				id: uuid(),
				data: {}
			});

			this.widgetAdderSelected = null;
		},

		removeWidget(widget) {
			removeColumnWidget(this.column.id, widget);
		},

		saveWidget(id, data) {
			updateColumnWidget(this.column.id, id, data);
		},

		func() {
			this.edit = !this.edit;
		}
	}
});
</script>

<style lang="scss" scoped>
.wtdtxvec {
	._panel {
		box-shadow: none;
	}

	> header {
		padding: 16px;

		> * {
			width: 100%;
			padding: 4px;
		}
	}

	> .widget, .customize-container {
		margin: 8px;

		&:first-of-type {
			margin-top: 0;
		}
	}

	.customize-container {
		position: relative;
		cursor: move;

		> *:not(.remove) {
			pointer-events: none;
		}

		> .remove {
			position: absolute;
			z-index: 2;
			top: 8px;
			right: 8px;
			width: 32px;
			height: 32px;
			color: #fff;
			background: rgba(#000, 0.7);
			border-radius: 4px;
		}
	}
}
</style>
