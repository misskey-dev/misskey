<template>
<div class="adhpbeos">
	<div class="label" @click="focus"><slot name="label"></slot></div>
	<div class="input" :class="{ disabled, focused, tall, pre }">
		<textarea ref="inputEl"
			v-model="v"
			v-panel
			:class="{ code, _monospace: code }"
			:disabled="disabled"
			:required="required"
			:readonly="readonly"
			:placeholder="placeholder"
			:pattern="pattern"
			:autocomplete="autocomplete"
			:spellcheck="spellcheck"
			@focus="focused = true"
			@blur="focused = false"
			@keydown="onKeydown($event)"
			@input="onInput"
		></textarea>
	</div>
	<div class="caption"><slot name="caption"></slot></div>

	<MkButton v-if="manualSave && changed" primary class="save" @click="updated"><i class="fas fa-save"></i> {{ $ts.save }}</MkButton>
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
		code: {
			type: Boolean,
			required: false
		},
		tall: {
			type: Boolean,
			required: false,
			default: false
		},
		pre: {
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
		const { modelValue, autofocus } = toRefs(props);
		const v = ref(modelValue.value);
		const focused = ref(false);
		const changed = ref(false);
		const invalid = ref(false);
		const filled = computed(() => v.value !== '' && v.value != null);
		const inputEl = ref(null);

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
			context.emit('update:modelValue', v.value);
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
			});
		});

		return {
			v,
			focused,
			invalid,
			changed,
			filled,
			inputEl,
			focus,
			onInput,
			onKeydown,
			updated,
		};
	},
});
</script>

<style lang="scss" scoped>
.adhpbeos {
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

		> textarea {
			appearance: none;
			-webkit-appearance: none;
			display: block;
			width: 100%;
			min-width: 100%;
			max-width: 100%;
			min-height: 130px;
			margin: 0;
			padding: 12px;
			font: inherit;
			font-weight: normal;
			font-size: 1em;
			color: var(--fg);
			border: solid 0.5px var(--panel);
			border-radius: 6px;
			outline: none;
			box-shadow: none;
			box-sizing: border-box;
			transition: border-color 0.1s ease-out;

			&:hover {
				border-color: var(--inputBorderHover);
			}
		}

		&.focused {
			> textarea {
				border-color: var(--accent);
			}
		}

		&.disabled {
			opacity: 0.7;

			&, * {
				cursor: not-allowed !important;
			}
		}

		&.tall {
			> textarea {
				min-height: 200px;
			}
		}

		&.pre {
			> textarea {
				white-space: pre;
			}
		}
	}

	> .save {
		margin: 8px 0 0 0;
	}
}
</style>
