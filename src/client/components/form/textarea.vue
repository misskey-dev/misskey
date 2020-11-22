<template>
<div class="rivhosbp _formItem" :class="{ tall, pre }">
	<div class="_formLabel"><slot></slot></div>
	<div class="input _formPanel">
		<textarea ref="input" :class="{ code, _monospace: code }"
			:value="value"
			:required="required"
			:readonly="readonly"
			:pattern="pattern"
			:autocomplete="autocomplete"
			:spellcheck="!code"
			@input="onInput"
			@focus="focused = true"
			@blur="focused = false"
		></textarea>
	</div>
	<button class="save _textButton" v-if="save && changed" @click="() => { changed = false; save(); }">{{ $t('save') }}</button>
	<div class="_formCaption"><slot name="desc"></slot></div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import './form.scss';

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
		save: {
			type: Function,
			required: false,
		},
	},
	data() {
		return {
			changed: false,
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
.rivhosbp {
	position: relative;

	> .input {
		position: relative;
	
		> textarea {
			display: block;
			width: 100%;
			min-width: 100%;
			max-width: 100%;
			min-height: 130px;
			margin: 0;
			padding: 16px;
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

			&.code {
				tab-size: 2;
			}
		}
	}

	> .save {
		margin: 6px 0 0 0;
		font-size: 0.8em;
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
