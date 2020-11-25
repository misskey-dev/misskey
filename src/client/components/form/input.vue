<template>
<div class="ztzhwixg _formItem" :class="{ inline, disabled }">
	<div class="_formLabel"><slot></slot></div>
	<div class="icon" ref="icon"><slot name="icon"></slot></div>
	<div class="input _formPanel">
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
			@keydown="onKeydown($event)"
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
			@keydown="onKeydown($event)"
			@input="onInput"
			:list="id"
		>
		<datalist :id="id" v-if="datalist">
			<option v-for="data in datalist" :value="data"/>
		</datalist>
		<div class="suffix" ref="suffixEl"><slot name="suffix"></slot></div>
	</div>
	<button class="save _textButton" v-if="save && changed" @click="() => { changed = false; save(); }">{{ $t('save') }}</button>
	<div class="_formCaption"><slot name="desc"></slot></div>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, nextTick, ref, watch, computed, toRefs } from 'vue';
import debounce from 'v-debounce';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import './form.scss';

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
	emits: ['change', 'keydown', 'enter'],
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

		watch(value, newValue => {
			v.value = newValue;
		});

		watch(v, newValue => {
			if (type?.value === 'number') {
				context.emit('update:value', parseFloat(newValue));
			} else {
				context.emit('update:value', newValue);
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
			faExclamationCircle,
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
		$height: 52px;
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

	> .save {
		margin: 6px 0 0 0;
		font-size: 0.8em;
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
