<template>
<div
	class="ziffeoms"
	:class="{ disabled, checked }"
>
	<input
		ref="input"
		type="checkbox"
		:disabled="disabled"
		@keydown.enter="toggle"
	>
	<span v-adaptive-border v-tooltip="checked ? $ts.itsOn : $ts.itsOff" class="button" @click.prevent="toggle">
		<i class="check fas fa-check"></i>
	</span>
	<span class="label">
		<span @click="toggle"><slot></slot></span>
		<p class="caption"><slot name="caption"></slot></p>
	</span>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		modelValue: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		}
	},
	computed: {
		checked(): boolean {
			return this.modelValue;
		}
	},
	methods: {
		toggle() {
			if (this.disabled) return;
			this.$emit('update:modelValue', !this.checked);
		}
	}
});
</script>

<style lang="scss" scoped>
.ziffeoms {
	position: relative;
	display: flex;
	transition: all 0.2s;

	> * {
		user-select: none;
	}

	> input {
		position: absolute;
		width: 0;
		height: 0;
		opacity: 0;
		margin: 0;
	}

	> .button {
		position: relative;
		display: inline-flex;
		flex-shrink: 0;
		margin: 0;
		box-sizing: border-box;
		width: 23px;
		height: 23px;
		outline: none;
		background: var(--panel);
		border: solid 1px var(--panel);
		border-radius: 4px;
		cursor: pointer;
		transition: inherit;

		> .check {
			margin: auto;
			opacity: 0;
			color: var(--fgOnAccent);
			font-size: 13px;
		}
	}

	&:hover {
		> .button {
			border-color: var(--inputBorderHover) !important;
		}
	}

	> .label {
		margin-left: 16px;
		margin-top: 2px;
		display: block;
		transition: inherit;
		color: var(--fg);

		> span {
			display: block;
			line-height: 20px;
			cursor: pointer;
			transition: inherit;
		}

		> .caption {
			margin: 8px 0 0 0;
			color: var(--fgTransparentWeak);
			font-size: 0.85em;

			&:empty {
				display: none;
			}
		}
	}

	&.disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	&.checked {
		> .button {
			background-color: var(--accent) !important;
			border-color: var(--accent) !important;

			> .check {
				opacity: 1;
			}
		}
	}
}
</style>
