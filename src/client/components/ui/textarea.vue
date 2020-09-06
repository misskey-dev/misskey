<template>
<div class="adhpbeos" :class="{ focused, filled, tall, pre }">
	<div class="input">
		<span class="label" ref="label"><slot></slot></span>
		<textarea ref="input"
			:value="value"
			:required="required"
			:readonly="readonly"
			:pattern="pattern"
			:autocomplete="autocomplete"
			@input="onInput"
			@focus="focused = true"
			@blur="focused = false"
		></textarea>
	</div>
	<button class="save _textButton" v-if="save && changed" @click="() => { changed = false; save(); }">{{ $t('save') }}</button>
	<div class="desc _caption"><slot name="desc"></slot></div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@/os';

export default defineComponent({
	props: {
		value: {
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
		pattern: {
			type: String,
			required: false
		},
		autocomplete: {
			type: String,
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
		save: {
			type: Function,
			required: false,
		},
	},
	data() {
		return {
			focused: false,
			changed: false,
		}
	},
	computed: {
		filled(): boolean {
			return this.value != '' && this.value != null;
		}
	},
	methods: {
		focus() {
			this.$refs.input.focus();
		},
		onInput(ev) {
			this.changed = true;
			this.$emit('update:value', ev.target.value);
		}
	}
});
</script>

<style lang="scss" scoped>
.adhpbeos {
	margin: 42px 0 32px 0;
	position: relative;

	&:first-child {
		margin-top: 16px;
	}

	&:last-child {
		margin-bottom: 0;
	}

	> .input {
		position: relative;
	
		&:before {
			content: '';
			display: block;
			position: absolute;
			top: 0;
			bottom: 0;
			left: 0;
			right: 0;
			background: none;
			border: solid 1px var(--inputBorder);
			border-radius: 3px;
			pointer-events: none;
		}

		&:after {
			content: '';
			display: block;
			position: absolute;
			top: 0;
			bottom: 0;
			left: 0;
			right: 0;
			background: none;
			border: solid 2px var(--accent);
			border-radius: 3px;
			opacity: 0;
			transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			pointer-events: none;
		}

		> .label {
			position: absolute;
			top: 6px;
			left: 12px;
			pointer-events: none;
			transition: 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
			transition-duration: 0.3s;
			font-size: 1em;
			line-height: 32px;
			pointer-events: none;
			//will-change transform
			transform-origin: top left;
			transform: scale(1);
		}

		> textarea {
			display: block;
			width: 100%;
			min-width: 100%;
			max-width: 100%;
			min-height: 130px;
			padding: 12px;
			box-sizing: border-box;
			font: inherit;
			font-weight: normal;
			font-size: 1em;
			background: transparent;
			border: none;
			border-radius: 0;
			outline: none;
			box-shadow: none;
			color: var(--fg);
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
				top: -24px;
				left: 0 !important;
				transform: scale(0.75);
			}
		}
	}

	&.tall {
		> .input {
			> textarea {
				min-height: 200px;
			}
		}
	}

	&.pre {
		> .input {
			> textarea {
				white-space: pre;
			}
		}
	}
}
</style>
