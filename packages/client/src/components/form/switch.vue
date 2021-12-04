<template>
<div
	class="ziffeoms"
	:class="{ disabled, checked }"
	role="switch"
	:aria-checked="checked"
	:aria-disabled="disabled"
	@click.prevent="toggle"
>
	<input
		ref="input"
		type="checkbox"
		:disabled="disabled"
		@keydown.enter="toggle"
	>
	<span v-tooltip="checked ? $ts.itsOn : $ts.itsOff" class="button">
		<span class="handle"></span>
	</span>
	<span class="label">
		<span><slot></slot></span>
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
	cursor: pointer;
	transition: all 0.3s;

	&:first-child {
		margin-top: 0;
	}

	&:last-child {
		margin-bottom: 0;
	}

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
		display: inline-block;
		flex-shrink: 0;
		margin: 0;
		width: 36px;
		height: 26px;
		background: var(--switchBg);
		outline: none;
		border-radius: 999px;
		transition: inherit;

		> .handle {
			position: absolute;
			top: 0;
			bottom: 0;
			left: 5px;
			margin: auto 0;
			border-radius: 100%;
			transition: background-color 0.3s, transform 0.3s;
			width: 16px;
			height: 16px;
			background-color: #fff;
		}
	}

	> .label {
		margin-left: 16px;
		margin-top: 2px;
		display: block;
		cursor: pointer;
		transition: inherit;
		color: var(--fg);

		> span {
			display: block;
			line-height: 20px;
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

	&:hover {
		> .button {
			background-color: var(--accentedBg);
		}
	}

	&.disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	&.checked {
		> .button {
			background-color: var(--accent);
			border-color: var(--accent);

			> .handle {
				transform: translateX(10px);
			}
		}
	}
}
</style>
