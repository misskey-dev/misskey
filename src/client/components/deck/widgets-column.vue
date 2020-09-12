<template>
<x-column :menu="menu" :naked="true" :column="column" :is-stacked="isStacked">
	<template #header><fa :icon="faWindowMaximize" style="margin-right: 8px;"/>{{ column.name }}</template>

	<div class="wtdtxvec">
		<template v-if="edit">
			<header>
				<mk-select v-model:value="widgetAdderSelected" style="margin-bottom: var(--margin)">
					<template #label>{{ $t('selectWidget') }}</template>
					<option v-for="widget in widgets" :value="widget" :key="widget">{{ $t(`_widgets.${widget}`) }}</option>
				</mk-select>
				<mk-button inline @click="addWidget" primary><fa :icon="faPlus"/> {{ $t('add') }}</mk-button>
				<mk-button inline @click="edit = false">{{ $t('close') }}</mk-button>
			</header>
			<x-draggable
				:list="column.widgets"
				animation="150"
				@sort="onWidgetSort"
			>
				<div v-for="widget in column.widgets" class="customize-container" :key="widget.id" @click="widgetFunc(widget.id)">
					<button class="remove _button" @click.prevent.stop="removeWidget(widget)"><fa :icon="faTimes"/></button>
					<component :is="`mkw-${widget.name}`" :widget="widget" :ref="widget.id" :is-customize-mode="true" :column="column"/>
				</div>
			</x-draggable>
		</template>
		<component v-else class="widget" v-for="widget in column.widgets" :is="`mkw-${widget.name}`" :key="widget.id" :ref="widget.id" :widget="widget" :column="column"/>
	</div>
</x-column>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { v4 as uuid } from 'uuid';
import { faWindowMaximize, faTimes, faCog, faPlus } from '@fortawesome/free-solid-svg-icons';
import MkSelect from '@/components/ui/select.vue';
import MkButton from '@/components/ui/button.vue';
import XColumn from './column.vue';
import { widgets } from '../../widgets';
import * as os from '@/os';

export default defineComponent({
	components: {
		XColumn,
		XDraggable: defineAsyncComponent(() => import('vue-draggable-next').then(x => x.VueDraggableNext)),
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
			menu: null,
			widgetAdderSelected: null,
			widgets,
			faWindowMaximize, faTimes, faPlus
		};
	},

	created() {
		this.menu = [{
			icon: faCog,
			text: this.$t('edit'),
			action: () => {
				this.edit = !this.edit;
			}
		}];
	},

	methods: {
		widgetFunc(id) {
			this.$refs[id][0].setting();
		},

		onWidgetSort() {
			this.saveWidgets();
		},

		addWidget() {
			if (this.widgetAdderSelected == null) return;

			this.$store.commit('deviceUser/addDeckWidget', {
				id: this.column.id,
				widget: {
					name: this.widgetAdderSelected,
					id: uuid(),
					data: {}
				}
			});

			this.widgetAdderSelected = null;
		},

		removeWidget(widget) {
			this.$store.commit('deviceUser/removeDeckWidget', {
				id: this.column.id,
				widget
			});
		},

		saveWidgets() {
			this.$store.commit('deviceUser/updateDeckColumn', this.column);
		}
	}
});
</script>

<style lang="scss" scoped>
.wtdtxvec {
	padding-top: 1px; // ウィジェットのbox-shadowを利用した1px borderを隠さないようにするため

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
