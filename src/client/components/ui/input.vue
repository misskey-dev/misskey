<template>
<div class="juejbjww" :class="{ focused, filled, inline, disabled }">
	<div class="icon" ref="icon"><slot name="icon"></slot></div>
	<div class="input">
		<span class="label" ref="labelEl"><slot></slot></span>
		<span class="title" ref="title">
			<slot name="title"></slot>
			<span class="warning" v-if="invalid"><fa :icon="faExclamationCircle"/>{{ $refs.input.validationMessage }}</span>
		</span>
		<div class="prefix" ref="prefixEl"><slot name="prefix"></slot></div>
		<input v-if="debounce" ref="inputEl"
			v-debounce="500"
			:type="type"
			v-model.lazy="v"
			:disabled="disabled"
			:required="required"
			:readonly="readonly"
			:placeholder="placeholder"
			:pattern="pattern"
			:autocomplete="autocomplete"
			:spellcheck="spellcheck"
			:step="step"
			@focus="focused = true"
			@blur="focused = false"
			@keydown="$emit('keydown', $event)"
			@input="onInput"
			:list="id"
		>
		<input v-else ref="inputEl"
			:type="type"
			v-model="v"
			:disabled="disabled"
			:required="required"
			:readonly="readonly"
			:placeholder="placeholder"
			:pattern="pattern"
			:autocomplete="autocomplete"
			:spellcheck="spellcheck"
			:step="step"
			@focus="focused = true"
			@blur="focused = false"
			@keydown="$emit('keydown', $event)"
			@input="onInput"
			:list="id"
		>
		<datalist :id="id" v-if="datalist">
			<option v-for="data in datalist" :value="data"/>
		</datalist>
		<div class="suffix" ref="suffixEl"><slot name="suffix"></slot></div>
	</div>
	<button class="save _textButton" v-if="save && changed" @click="() => { changed = false; save(); }">{{ $t('save') }}</button>
	<div class="desc _caption"><slot name="desc"></slot></div>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, nextTick, ref, watch, computed, toRefs } from 'vue';
import debounce from 'v-debounce';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

export default defineComponent({
	directives: {
		debounce
	},
	props: {
		value: {
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
		debounce: {
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
		save: {
			type: Function,
			required: false,
		},
	},
	setup(props, context) {
		const { value, type, autofocus } = toRefs(props);
		const v = ref(value.value);
		const id = Math.random().toString(); // TODO: uuid?
		const focused = ref(false);
		const changed = ref(false);
		const invalid = ref(false);
		const filled = computed(() => v.value !== '' && v.value != null);
		const inputEl = ref(null);
		const prefixEl = ref(null);
		const suffixEl = ref(null);
		const labelEl = ref(null);

		const focus = () => inputEl.value.focus();
		const onInput = (ev) => {
			changed.value = true;
			context.emit('change', ev);
		};

		watch(value, newValue => {
			v.value = newValue;
		});

		watch(v, newValue => {
			if (type.value === 'number') {
				context.emit('update:value', parseFloat(newValue));
			} else {
				context.emit('update:value', newValue);
			}

			invalid.value = inputEl.value.validity.badInput;
		});

		onMounted(() => {
			// TODO: vue3
			/*this.$on('keydown', (e: KeyboardEvent) => {
				if (e.code == 'Enter') {
					this.$emit('enter');
				}
			});*/

			nextTick(() => {
				if (autofocus.value) {
					focus();
				}

				// このコンポーネントが作成された時、非表示状態である場合がある
				// 非表示状態だと要素の幅などは0になってしまうので、定期的に計算する
				const clock = setInterval(() => {
					if (prefixEl.value) {
						labelEl.value.style.left = (prefixEl.value.offsetLeft + prefixEl.value.offsetWidth) + 'px';
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
			focused,
			changed,
			filled,
			inputEl,
			prefixEl,
			suffixEl,
			labelEl,
			focus,
			onInput,
			faExclamationCircle,
		};
	},
});
</script>

<style lang="scss" scoped>
.juejbjww {
	position: relative;
	margin: 32px 0;

	&:not(.inline):first-child {
		margin-top: 8px;
	}

	&:not(.inline):last-child {
		margin-bottom: 8px;
	}

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
		position: relative;

		&:before {
			content: '';
			display: block;
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			height: 1px;
			background: var(--inputBorder);
		}

		&:after {
			content: '';
			display: block;
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			height: 2px;
			background: var(--accent);
			opacity: 0;
			transform: scaleX(0.12);
			transition: border 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			will-change: border opacity transform;
		}

		> .label {
			position: absolute;
			z-index: 1;
			top: 0;
			left: 0;
			pointer-events: none;
			transition: 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
			transition-duration: 0.3s;
			font-size: 1em;
			line-height: 32px;
			color: var(--inputLabel);
			pointer-events: none;
			//will-change transform
			transform-origin: top left;
			transform: scale(1);
		}

		> .title {
			position: absolute;
			z-index: 1;
			top: -17px;
			left: 0 !important;
			pointer-events: none;
			font-size: 1em;
			line-height: 32px;
			color: var(--inputLabel);
			pointer-events: none;
			//will-change transform
			transform-origin: top left;
			transform: scale(.75);
			white-space: nowrap;
			width: 133%;
			overflow: hidden;
			text-overflow: ellipsis;

			> .warning {
				margin-left: 0.5em;
				color: var(--infoWarnFg);

				> svg {
					margin-right: 0.1em;
				}
			}
		}

		> input {
			$height: 32px;
			display: block;
			height: $height;
			width: 100%;
			margin: 0;
			padding: 0;
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
			font-size: 1em;
			line-height: 32px;
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
			padding-right: 4px;
		}

		> .suffix {
			right: 0;
			padding-left: 4px;
		}
	}

	> .save {
		margin: 6px 0 0 0;
		font-size: 0.8em;
	}

	> .desc {
		margin: 6px 0 0 0;

		&:empty {
			display: none;
		}

		* {
			margin: 0;
		}
	}

	&.focused {
		> .input {
			&:after {
				opacity: 1;
				transform: scaleX(1);
			}

			> .label {
				color: var(--accent);
			}
		}
	}

	&.focused,
	&.filled {
		> .input {
			> .label {
				top: -17px;
				left: 0 !important;
				transform: scale(0.75);
			}
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
