<template>
<x-column :menu="menu" :naked="true" :column="column" :is-stacked="isStacked">
	<template #header><fa :icon="faWindowMaximize" style="margin-right: 8px;"/>{{ column.name }}</template>

	<div class="wtdtxvec">
		<template v-if="edit">
			<header>
				<select v-model="widgetAdderSelected" @change="addWidget">
					<option v-for="widget in widgets" :value="widget" :key="widget">{{ widget }}</option>
				</select>
			</header>
			<x-draggable
				:list="column.widgets"
				animation="150"
				@sort="onWidgetSort"
			>
				<div v-for="widget in column.widgets" class="customize-container" :key="widget.id" @click="widgetFunc(widget.id)">
					<button class="remove _button" @click="removeWidget(widget)"><fa :icon="faTimes"/></button>
					<component :is="`mkw-${widget.name}`" :widget="widget" :ref="widget.id" :is-customize-mode="true" :column="column"/>
				</div>
			</x-draggable>
		</template>
		<component v-else class="widget" v-for="widget in column.widgets" :is="`mkw-${widget.name}`" :key="widget.id" :ref="widget.id" :widget="widget" :column="column"/>
	</div>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import * as XDraggable from 'vuedraggable';
import { v4 as uuid } from 'uuid';
import { faWindowMaximize, faTimes } from '@fortawesome/free-solid-svg-icons';
import XColumn from './column.vue';
import { widgets } from '../../widgets';

export default Vue.extend({
	components: {
		XColumn,
		XDraggable,
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
			faWindowMaximize, faTimes
		};
	},

	created() {
		this.menu = [{
			icon: 'cog',
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
