<template>
<div
	v-adaptive-border
	class="novjtctn"
	:class="{ disabled, checked }"
	:aria-checked="checked"
	:aria-disabled="disabled"
	@click="toggle"
>
	<input
		type="radio"
		:disabled="disabled"
	>
	<span class="button">
		<span></span>
	</span>
	<span class="label"><slot></slot></span>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';

const props = defineProps<{
	modelValue: any;
	value: any;
	disabled: boolean;
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: any): void;
}>();

let checked = $computed(() => props.modelValue === props.value);

function toggle(): void {
	if (props.disabled) return;
	emit('update:modelValue', props.value);
}
</script>

<style lang="scss" scoped>
.novjtctn {
	position: relative;
	display: inline-block;
	text-align: left;
	cursor: pointer;
	padding: 8px 10px;
	min-width: 60px;
	background-color: var(--panel);
	background-clip: padding-box !important;
	border: solid 1px var(--panel);
	border-radius: 6px;
	transition: all 0.2s;

	> * {
		user-select: none;
	}

	&.disabled {
		opacity: 0.6;

		&, * {
			cursor: not-allowed !important;
		}
	}

	&:hover {
		border-color: var(--inputBorderHover) !important;
	}

	&.checked {
		background-color: var(--accentedBg) !important;
		border-color: var(--accentedBg) !important;
		color: var(--accent);

		&, * {
			cursor: default !important;
		}

		> .button {
			border-color: var(--accent);

			&:after {
				background-color: var(--accent);
				transform: scale(1);
				opacity: 1;
			}
		}
	}

	> input {
		position: absolute;
		width: 0;
		height: 0;
		opacity: 0;
		margin: 0;
	}

	> .button {
		position: absolute;
		width: 14px;
		height: 14px;
		background: none;
		border: solid 2px var(--inputBorder);
		border-radius: 100%;
		transition: inherit;

		&:after {
			content: '';
			display: block;
			position: absolute;
			top: 3px;
			right: 3px;
			bottom: 3px;
			left: 3px;
			border-radius: 100%;
			opacity: 0;
			transform: scale(0);
			transition: 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
		}
	}

	> .label {
		margin-left: 28px;
		display: block;
		line-height: 20px;
		cursor: pointer;
	}
}
</style>
