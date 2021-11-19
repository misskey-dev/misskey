<template>
<div class="matxzzsk">
	<div class="label" @click="focus"><slot name="label"></slot></div>
	<div class="input" :class="{ inline, disabled, focused }">
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
	<div class="caption"><slot name="caption"></slot></div>

	<MkButton v-if="manualSave && changed" primary @click="updated"><i class="fas fa-save"></i> {{ $ts.save }}</MkButton>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, nextTick, ref, watch, computed, toRefs } from 'vue';
import MkButton from '@/components/ui/button.vue';
import { debounce } from 'throttle-debounce';

export default defineComponent({
	components: {
		MkButton,
	},

	props: {
		modelValue: {
			required: true
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
		debounce: {
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
.matxzzsk {
	> .label {
		font-size: 0.85em;
		padding: 0 0 8px 12px;
		user-select: none;

		&:empty {
			display: none;
		}
	}

	> .caption {
		font-size: 0.8em;
		padding: 8px 0 0 12px;
		color: var(--fgTransparentWeak);

		&:empty {
			display: none;
		}
	}

	> .input {
		$height: 42px;
		position: relative;

		> input {
			appearance: none;
			-webkit-appearance: none;
			display: block;
			height: $height;
			width: 100%;
			margin: 0;
			padding: 0 12px;
			font: inherit;
			font-weight: normal;
			font-size: 1em;
			color: var(--fg);
			background: var(--panel);
			border: solid 0.5px var(--inputBorder);
			border-radius: 6px;
			outline: none;
			box-shadow: none;
			box-sizing: border-box;
			transition: border-color 0.1s ease-out;

			&:hover {
				border-color: var(--inputBorderHover);
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
			height: $height;
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
				border-color: var(--accent);
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
}
</style>
