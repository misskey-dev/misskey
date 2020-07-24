<template>
<div class="juejbjww" :class="{ focused, filled, inline, disabled }">
	<div class="icon" ref="icon"><slot name="icon"></slot></div>
	<div class="input">
		<span class="label" ref="label"><slot></slot></span>
		<span class="title" ref="title">
			<slot name="title"></slot>
			<span class="warning" v-if="invalid"><fa :icon="faExclamationCircle"/>{{ $refs.input.validationMessage }}</span>
		</span>
		<div class="prefix" ref="prefix"><slot name="prefix"></slot></div>
		<template v-if="type != 'file'">
			<input v-if="debounce" ref="input"
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
			<input v-else ref="input"
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
		</template>
		<template v-else>
			<input ref="input"
				type="text"
				:value="filePlaceholder"
				readonly
				@click="chooseFile"
			>
			<input ref="file"
				type="file"
				:value="value"
				@change="onChangeFile"
			>
		</template>
		<div class="suffix" ref="suffix"><slot name="suffix"></slot></div>
	</div>
	<button class="save _textButton" v-if="save && changed" @click="() => { changed = false; save(); }">{{ $t('save') }}</button>
	<div class="desc"><slot name="desc"></slot></div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import debounce from 'v-debounce';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
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
	data() {
		return {
			v: this.value,
			focused: false,
			invalid: false,
			changed: false,
			id: Math.random().toString(),
			faExclamationCircle
		};
	},
	computed: {
		filled(): boolean {
			return this.v !== '' && this.v != null;
		},
		filePlaceholder(): string | null {
			if (this.type != 'file') return null;
			if (this.v == null) return null;

			if (typeof this.v == 'string') return this.v;

			if (Array.isArray(this.v)) {
				return this.v.map(file => file.name).join(', ');
			} else {
				return this.v.name;
			}
		}
	},
	watch: {
		value(v) {
			this.v = v;
		},
		v(v) {
			if (this.type === 'number') {
				this.$emit('input', parseFloat(v));
			} else {
				this.$emit('input', v);
			}

			this.invalid = this.$refs.input.validity.badInput;
		}
	},
	mounted() {
		if (this.autofocus) {
			this.$nextTick(() => {
				this.$refs.input.focus();
			});
		}

		this.$nextTick(() => {
			// このコンポーネントが作成された時、非表示状態である場合がある
			// 非表示状態だと要素の幅などは0になってしまうので、定期的に計算する
			const clock = setInterval(() => {
				if (this.$refs.prefix) {
					this.$refs.label.style.left = (this.$refs.prefix.offsetLeft + this.$refs.prefix.offsetWidth) + 'px';
					if (this.$refs.prefix.offsetWidth) {
						this.$refs.input.style.paddingLeft = this.$refs.prefix.offsetWidth + 'px';
					}
				}
				if (this.$refs.suffix) {
					if (this.$refs.suffix.offsetWidth) {
						this.$refs.input.style.paddingRight = this.$refs.suffix.offsetWidth + 'px';
					}
				}
			}, 100);

			this.$once('hook:beforeDestroy', () => {
				clearInterval(clock);
			});
		});

		this.$on('keydown', (e: KeyboardEvent) => {
			if (e.code == 'Enter') {
				this.$emit('enter');
			}
		});
	},
	methods: {
		focus() {
			this.$refs.input.focus();
		},
		togglePassword() {
			if (this.type == 'password') {
				this.type = 'text'
			} else {
				this.type = 'password'
			}
		},
		chooseFile() {
			this.$refs.file.click();
		},
		onChangeFile() {
			this.v = Array.from((this.$refs.file as any).files);
			this.$emit('input', this.v);
			this.$emit('change', this.v);
		},
		onInput(ev) {
			this.changed = true;
			this.$emit('change', ev);
		}
	}
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
		font-size: 13px;
	}

	> .desc {
		margin: 6px 0 0 0;
		font-size: 13px;
		opacity: 0.7;

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
