<template>
<div class="matxzzsk">
	<div class="label" @click="focus"><slot name="label"></slot></div>
	<div class="input" :class="{ inline, disabled, focused }">
		<div ref="prefixEl" class="prefix"><slot name="prefix"></slot></div>
		<input
			ref="inputEl"
			v-model="v"
			v-adaptive-border
			:type="type"
			:disabled="disabled"
			:required="required"
			:readonly="readonly"
			:placeholder="placeholder"
			:pattern="pattern"
			:autocomplete="autocomplete"
			:spellcheck="spellcheck"
			:step="step"
			:list="id"
			@focus="focused = true"
			@blur="focused = false"
			@keydown="onKeydown($event)"
			@input="onInput"
		>
		<datalist v-if="datalist" :id="id">
			<option v-for="data in datalist" :value="data"/>
		</datalist>
		<div ref="suffixEl" class="suffix"><slot name="suffix"></slot></div>
	</div>
	<div class="caption"><slot name="caption"></slot></div>

	<MkButton v-if="manualSave && changed" primary class="save" @click="updated"><i class="fas fa-check"></i> {{ $ts.save }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, nextTick, ref, watch, computed, toRefs } from 'vue';
import { debounce } from 'throttle-debounce';
import MkButton from '@/components/ui/button.vue';
import { useInterval } from '@/scripts/use-interval';

const props = defineProps<{
	modelValue: string | number;
	type?: 'text' | 'number' | 'password' | 'email' | 'url' | 'date' | 'time' | 'search';
	required?: boolean;
	readonly?: boolean;
	disabled?: boolean;
	pattern?: string;
	placeholder?: string;
	autofocus?: boolean;
	autocomplete?: boolean;
	spellcheck?: boolean;
	step?: any;
	datalist?: string[];
	inline?: boolean;
	debounce?: boolean;
	manualSave?: boolean;
	small?: boolean;
	large?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'change', _ev: KeyboardEvent): void;
	(ev: 'keydown', _ev: KeyboardEvent): void;
	(ev: 'enter'): void;
	(ev: 'update:modelValue', value: string | number): void;
}>();

const { modelValue, type, autofocus } = toRefs(props);
const v = ref(modelValue.value);
const id = Math.random().toString(); // TODO: uuid?
const focused = ref(false);
const changed = ref(false);
const invalid = ref(false);
const filled = computed(() => v.value !== '' && v.value != null);
const inputEl = ref<HTMLElement>();
const prefixEl = ref<HTMLElement>();
const suffixEl = ref<HTMLElement>();
const height =
	props.small ? 38 :
	props.large ? 42 :
	40;

const focus = () => inputEl.value.focus();
const onInput = (ev: KeyboardEvent) => {
	changed.value = true;
	emit('change', ev);
};
const onKeydown = (ev: KeyboardEvent) => {
	emit('keydown', ev);

	if (ev.code === 'Enter') {
		emit('enter');
	}
};

const updated = () => {
	changed.value = false;
	if (type.value === 'number') {
		emit('update:modelValue', parseFloat(v.value));
	} else {
		emit('update:modelValue', v.value);
	}
};

const debouncedUpdated = debounce(1000, updated);

watch(modelValue, newValue => {
	v.value = newValue;
});

watch(v, newValue => {
	if (!props.manualSave) {
		if (props.debounce) {
			debouncedUpdated();
		} else {
			updated();
		}
	}

	invalid.value = inputEl.value.validity.badInput;
});

// このコンポーネントが作成された時、非表示状態である場合がある
// 非表示状態だと要素の幅などは0になってしまうので、定期的に計算する
useInterval(() => {
	if (prefixEl.value) {
		if (prefixEl.value.offsetWidth) {
			inputEl.value.style.paddingLeft = prefixEl.value.offsetWidth + 'px';
		}
	}
	if (suffixEl.value) {
		if (suffixEl.value.offsetWidth) {
			inputEl.value.style.paddingRight = suffixEl.value.offsetWidth + 'px';
		}
	}
}, 100, {
	immediate: true,
	afterMounted: true,
});

onMounted(() => {
	nextTick(() => {
		if (autofocus.value) {
			focus();
		}
	});
});
</script>

<style lang="scss" scoped>
.matxzzsk {
	> .label {
		font-size: 0.85em;
		padding: 0 0 8px 0;
		user-select: none;

		&:empty {
			display: none;
		}
	}

	> .caption {
		font-size: 0.85em;
		padding: 8px 0 0 0;
		color: var(--fgTransparentWeak);

		&:empty {
			display: none;
		}
	}

	> .input {
		position: relative;

		> input {
			appearance: none;
			-webkit-appearance: none;
			display: block;
			height: v-bind("height + 'px'");
			width: 100%;
			margin: 0;
			padding: 0 12px;
			font: inherit;
			font-weight: normal;
			font-size: 1em;
			color: var(--fg);
			background: var(--panel);
			border: solid 1px var(--panel);
			border-radius: 6px;
			outline: none;
			box-shadow: none;
			box-sizing: border-box;
			transition: border-color 0.1s ease-out;

			&:hover {
				border-color: var(--inputBorderHover) !important;
			}
		}

		> .prefix,
		> .suffix {
			display: flex;
			align-items: center;
			position: absolute;
			z-index: 1;
			top: 0;
			padding: 0 12px;
			font-size: 1em;
			height: v-bind("height + 'px'");
			pointer-events: none;

			&:empty {
				display: none;
			}

			> * {
				display: inline-block;
				min-width: 16px;
				max-width: 150px;
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
			}
		}

		> .prefix {
			left: 0;
			padding-right: 6px;
		}

		> .suffix {
			right: 0;
			padding-left: 6px;
		}

		&.inline {
			display: inline-block;
			margin: 0;
		}

		&.focused {
			> input {
				border-color: var(--accent) !important;
				//box-shadow: 0 0 0 4px var(--focus);
			}
		}

		&.disabled {
			opacity: 0.7;

			&, * {
				cursor: not-allowed !important;
			}
		}
	}

	> .save {
		margin: 8px 0 0 0;
	}
}
</style>
