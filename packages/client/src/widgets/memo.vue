<template>
<MkContainer :show-header="widgetProps.showHeader" class="mkw-memo">
	<template #header><i class="fas fa-sticky-note"></i>{{ i18n.ts._widgets.memo }}</template>

	<div class="otgbylcu">
		<textarea v-model="text" :placeholder="i18n.ts.placeholder" @input="onChange"></textarea>
		<button :disabled="!changed" class="_buttonPrimary" @click="saveMemo">{{ i18n.ts.save }}</button>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import { GetFormResultType } from '@/scripts/form';
import * as os from '@/os';
import MkContainer from '@/components/MkContainer.vue';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';

const name = 'memo';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

// 現時点ではvueの制限によりimportしたtypeをジェネリックに渡せない
//const props = defineProps<WidgetComponentProps<WidgetProps>>();
//const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const props = defineProps<{ widget?: Widget<WidgetProps>; }>();
const emit = defineEmits<{ (ev: 'updateProps', props: WidgetProps); }>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const text = ref<string | null>(defaultStore.state.memo);
const changed = ref(false);
let timeoutId;

const saveMemo = () => {
	defaultStore.set('memo', text.value);
	changed.value = false;
};

const onChange = () => {
	changed.value = true;
	window.clearTimeout(timeoutId);
	timeoutId = window.setTimeout(saveMemo, 1000);
};

watch(() => defaultStore.reactiveState.memo, newText => {
	text.value = newText.value;
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.otgbylcu {
	padding-bottom: 28px + 16px;

	> textarea {
		display: block;
		width: 100%;
		max-width: 100%;
		min-width: 100%;
		padding: 16px;
		color: var(--fg);
		background: transparent;
		border: none;
		border-bottom: solid 0.5px var(--divider);
		border-radius: 0;
		box-sizing: border-box;
		font: inherit;
		font-size: 0.9em;

		&:focus-visible {
			outline: none;
		}
	}

	> button {
		display: block;
		position: absolute;
		bottom: 8px;
		right: 8px;
		margin: 0;
		padding: 0 10px;
		height: 28px;
		outline: none;
		border-radius: 4px;

		&:disabled {
			opacity: 0.7;
			cursor: default;
		}
	}
}
</style>
