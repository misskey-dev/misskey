<template>
<div class="yrtfrpux _debobigegoItem" :class="{ disabled, inline }">
	<div class="_debobigegoLabel"><slot name="label"></slot></div>
	<div ref="icon" class="icon"><slot name="icon"></slot></div>
	<div class="input _debobigegoPanel _debobigegoClickable" @click="focus">
		<div ref="prefix" class="prefix"><slot name="prefix"></slot></div>
		<select ref="input"
			v-model="v"
			:required="required"
			:disabled="disabled"
			@focus="focused = true"
			@blur="focused = false"
		>
			<slot></slot>
		</select>
		<div class="suffix">
			<i class="fas fa-chevron-down"></i>
		</div>
	</div>
	<div class="_debobigegoCaption"><slot name="caption"></slot></div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import './debobigego.scss';

export default defineComponent({
	props: {
		modelValue: {
			required: false
		},
		required: {
			type: Boolean,
			required: false
		},
		disabled: {
			type: Boolean,
			required: false
		},
		inline: {
			type: Boolean,
			required: false,
			default: false
		},
	},
	data() {
		return {
		};
	},
	computed: {
		v: {
			get() {
				return this.modelValue;
			},
			set(v) {
				this.$emit('update:modelValue', v);
			}
		},
	},
	methods: {
		focus() {
			this.$refs.input.focus();
		}
	}
});
</script>

<style lang="scss" scoped>
.yrtfrpux {
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
		display: flex;
		position: relative;

		> select {
			display: block;
			flex: 1;
			width: 100%;
			padding: 0 16px;
			font: inherit;
			font-weight: normal;
			font-size: 1em;
			height: 48px;
			background: none;
			border: none;
			border-radius: 0;
			outline: none;
			box-shadow: none;
			appearance: none;
			-webkit-appearance: none;
			color: var(--fg);

			option,
			optgroup {
				color: var(--fg);
				background: var(--bg);
			}
		}

		> .prefix,
		> .suffix {
			display: block;
			align-self: center;
			justify-self: center;
			font-size: 1em;
			line-height: 32px;
			color: var(--inputLabel);
			pointer-events: none;

			&:empty {
				display: none;
			}

			> * {
				display: block;
				min-width: 16px;
			}
		}

		> .prefix {
			padding-right: 4px;
		}

		> .suffix {
			padding: 0 16px 0 0;
			opacity: 0.7;
		}
	}
}
</style>
