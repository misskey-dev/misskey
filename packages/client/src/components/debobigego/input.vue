<template>
<FormGroup class="_debobigegoItem">
	<template #label><slot></slot></template>
	<div class="ztzhwixg _debobigegoItem" :class="{ inline, disabled }">
		<div ref="icon" class="icon"><slot name="icon"></slot></div>
		<div class="input _debobigegoPanel">
			<div ref="prefixEl" class="prefix"><slot name="prefix"></slot></div>
			<input ref="inputEl"
				v-model="v"
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
	</div>
	<template #caption><slot name="desc"></slot></template>

	<FormButton v-if="manualSave && changed" primary @click="updated"><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
</FormGroup>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, nextTick, ref, watch, computed, toRefs } from 'vue';
import './debobigego.scss';
import FormButton from './button.vue';
import FormGroup from './group.vue';

export default defineComponent({
	components: {
		FormGroup,
		FormButton,
	},
	props: {
		modelValue: {
			required: false
		},
		type: {
			type: String,
			required: false
		},
		required: {
			type: Boolean,
			required: false
		},
		readonly: {
			type: Boolean,
			required: false
		},
		disabled: {
			type: Boolean,
			required: false
		},
		pattern: {
			type: String,
			required: false
		},
		placeholder: {
			type: String,
			required: false
		},
		autofocus: {
			type: Boolean,
			required: false,
			default: false
		},
		autocomplete: {
			required: false
		},
		spellcheck: {
			required: false
		},
		step: {
			required: false
		},
		datalist: {
			type: Array,
			required: false,
		},
		inline: {
			type: Boolean,
			required: false,
			default: false
		},
		manualSave: {
			type: Boolean,
			required: false,
			default: false
		},
	},
	emits: ['change', 'keydown', 'enter', 'update:modelValue'],
	setup(props, context) {
		const { modelValue, type, autofocus } = toRefs(props);
		const v = ref(modelValue.value);
		const id = Math.random().toString(); // TODO: uuid?
		const focused = ref(false);
		const changed = ref(false);
		const invalid = ref(false);
		const filled = computed(() => v.value !== '' && v.value != null);
		const inputEl = ref(null);
		const prefixEl = ref(null);
		const suffixEl = ref(null);

		const focus = () => inputEl.value.focus();
		const onInput = (ev) => {
			changed.value = true;
			context.emit('change', ev);
		};
		const onKeydown = (ev: KeyboardEvent) => {
			context.emit('keydown', ev);

			if (ev.code === 'Enter') {
				context.emit('enter');
			}
		};

		const updated = () => {
			changed.value = false;
			if (type?.value === 'number') {
				context.emit('update:modelValue', parseFloat(v.value));
			} else {
				context.emit('update:modelValue', v.value);
			}
		};

		watch(modelValue.value, newValue => {
			v.value = newValue;
		});

		watch(v, newValue => {
			if (!props.manualSave) {
				updated();
			}

			invalid.value = inputEl.value.validity.badInput;
		});

		onMounted(() => {
			nextTick(() => {
				if (autofocus.value) {
					focus();
				}

				// このコンポーネントが作成された時、非表示状態である場合がある
				// 非表示状態だと要素の幅などは0になってしまうので、定期的に計算する
				const clock = setInterval(() => {
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
				}, 100);

				onUnmounted(() => {
					clearInterval(clock);
				});
			});
		});

		return {
			id,
			v,
			focused,
			invalid,
			changed,
			filled,
			inputEl,
			prefixEl,
			suffixEl,
			focus,
			onInput,
			onKeydown,
			updated,
		};
	},
});
</script>

<style lang="scss" scoped>
.ztzhwixg {
	position: relative;

	> .icon {
		position: absolute;
		top: 0;
		left: 0;
		width: 24px;
		text-align: center;
		line-height: 32px;

		&:not(:empty) + .input {
			margin-left: 28px;
		}
	}

	> .input {
		$height: 48px;
		position: relative;

		> input {
			display: block;
			height: $height;
			width: 100%;
			margin: 0;
			padding: 0 16px;
			font: inherit;
			font-weight: normal;
			font-size: 1em;
			line-height: $height;
			color: var(--inputText);
			background: transparent;
			border: none;
			border-radius: 0;
			outline: none;
			box-shadow: none;
			box-sizing: border-box;

			&[type='file'] {
				display: none;
			}
		}

		> .prefix,
		> .suffix {
			display: block;
			position: absolute;
			z-index: 1;
			top: 0;
			padding: 0 16px;
			font-size: 1em;
			line-height: $height;
			color: var(--inputLabel);
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
			padding-right: 8px;
		}

		> .suffix {
			right: 0;
			padding-left: 8px;
		}
	}

	&.inline {
		display: inline-block;
		margin: 0;
	}

	&.disabled {
		opacity: 0.7;

		&, * {
			cursor: not-allowed !important;
		}
	}
}
</style>
