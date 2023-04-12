<template>
<div :class="$style.root">
	<template v-if="edit">
		<header :class="$style['edit-header']">
			<MkSelect v-model="widgetAdderSelected" style="margin-bottom: var(--margin)" class="mk-widget-select">
				<template #label>{{ i18n.ts.selectWidget }}</template>
				<option v-for="widget in widgetDefs" :key="widget" :value="widget">{{ i18n.t(`_widgets.${widget}`) }}</option>
			</MkSelect>
			<MkButton inline primary class="mk-widget-add" @click="addWidget"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>
			<MkButton inline @click="$emit('exit')">{{ i18n.ts.close }}</MkButton>
		</header>
		<Sortable
			:model-value="props.widgets"
			item-key="id"
			handle=".handle"
			:animation="150"
			:group="{ name: 'SortableMkWidgets' }"
			:class="$style['edit-editing']"
			@update:model-value="v => emit('updateWidgets', v)"
		>
			<template #item="{element}">
				<div :class="[$style.widget, $style['customize-container']]" data-cy-customize-container>
					<button :class="$style['customize-container-config']" class="_button" @click.prevent.stop="configWidget(element.id)"><i class="ti ti-settings"></i></button>
					<button :class="$style['customize-container-remove']" data-cy-customize-container-remove class="_button" @click.prevent.stop="removeWidget(element)"><i class="ti ti-x"></i></button>
					<div class="handle">
						<component :is="`widget-${element.name}`" :ref="el => widgetRefs[element.id] = el" class="widget" :class="$style['customize-container-handle-widget']" :widget="element" @update-props="updateWidget(element.id, $event)"/>
					</div>
				</div>
			</template>
		</Sortable>
	</template>
	<component :is="`widget-${widget.name}`" v-for="widget in widgets" v-else :key="widget.id" :ref="el => widgetRefs[widget.id] = el" :class="$style.widget" :widget="widget" @update-props="updateWidget(widget.id, $event)" @contextmenu.stop="onContextmenu(widget, $event)"/>
</div>
</template>
<script lang="ts">
export type Widget = {
	name: string;
	id: string;
	data: Record<string, any>;
};
export type DefaultStoredWidget = {
	place: string | null;
} & Widget;
</script>
<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue';
import { v4 as uuid } from 'uuid';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import { widgets as widgetDefs } from '@/widgets';
import * as os from '@/os';
import { i18n } from '@/i18n';

const Sortable = defineAsyncComponent(() => import('vuedraggable').then(x => x.default));

const props = defineProps<{
	widgets: Widget[];
	edit: boolean;
}>();

const emit = defineEmits<{
	(ev: 'updateWidgets', widgets: Widget[]): void;
	(ev: 'addWidget', widget: Widget): void;
	(ev: 'removeWidget', widget: Widget): void;
	(ev: 'updateWidget', widget: Partial<Widget>): void;
	(ev: 'exit'): void;
}>();

const widgetRefs = {};
const configWidget = (id: string) => {
	widgetRefs[id].configure();
};
const widgetAdderSelected = ref(null);
const addWidget = () => {
	if (widgetAdderSelected.value == null) return;

	emit('addWidget', {
		name: widgetAdderSelected.value,
		id: uuid(),
		data: {},
	});

	widgetAdderSelected.value = null;
};
const removeWidget = (widget) => {
	emit('removeWidget', widget);
};
const updateWidget = (id, data) => {
	emit('updateWidget', { id, data });
};

function onContextmenu(widget: Widget, ev: MouseEvent) {
	const isLink = (el: HTMLElement) => {
		if (el.tagName === 'A') return true;
		if (el.parentElement) {
			return isLink(el.parentElement);
		}
	};
	if (isLink(ev.target)) return;
	if (['INPUT', 'TEXTAREA', 'IMG', 'VIDEO', 'CANVAS'].includes(ev.target.tagName) || ev.target.attributes['contenteditable']) return;
	if (window.getSelection()?.toString() !== '') return;

	os.contextMenu([{
		type: 'label',
		text: i18n.t(`_widgets.${widget.name}`),
	}, {
		icon: 'ti ti-settings',
		text: i18n.ts.settings,
		action: () => {
			configWidget(widget.id);
		},
	}], ev);
}
</script>

<style lang="scss" module>
.root {
	container-type: inline-size;
}

.widget {
	contain: content;
	margin: var(--margin) 0;

	&:first-of-type {
		margin-top: 0;
	}
}

.edit {
	&-header {
		margin: 16px 0;

		> * {
			width: 100%;
			padding: 4px;
		}
	}

	&-editing {
		min-height: 100px;
	}
}

.customize-container {
	position: relative;
	cursor: move;

	&-config,
	&-remove {
		position: absolute;
		z-index: 10000;
		top: 8px;
		width: 32px;
		height: 32px;
		color: #fff;
		background: rgba(#000, 0.7);
		border-radius: 4px;
	}

	&-config {
		right: 8px + 8px + 32px;
	}

	&-remove {
		right: 8px;
	}

	&-handle {

		&-widget {
			pointer-events: none;
		}
	}

}

</style>
