<template>
<XColumn :menu="menu" :naked="true" :column="column" :is-stacked="isStacked">
	<template #header><Fa :icon="faWindowMaximize" style="margin-right: 8px;"/>{{ column.name }}</template>

	<div class="wtdtxvec">
		<template v-if="edit">
			<header>
				<MkSelect v-model:value="widgetAdderSelected" style="margin-bottom: var(--margin)">
					<template #label>{{ $t('selectWidget') }}</template>
					<option v-for="widget in widgets" :value="widget" :key="widget">{{ $t(`_widgets.${widget}`) }}</option>
				</MkSelect>
				<MkButton inline @click="addWidget" primary><Fa :icon="faPlus"/> {{ $t('add') }}</MkButton>
				<MkButton inline @click="edit = false">{{ $t('close') }}</MkButton>
			</header>
			<XDraggable
				:list="column.widgets"
				animation="150"
				@sort="onWidgetSort"
			>
				<div v-for="widget in column.widgets" class="customize-container" :key="widget.id" @click="widgetFunc(widget.id)">
					<button class="remove _button" @click.prevent.stop="removeWidget(widget)"><Fa :icon="faTimes"/></button>
					<component :is="`mkw-${widget.name}`" :widget="widget" :ref="widget.id" :column="column"/>
				</div>
			</XDraggable>
		</template>
		<component v-else class="widget" v-for="widget in column.widgets" :is="`mkw-${widget.name}`" :key="widget.id" :widget="widget" :column="column"/>
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
