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
	<span ref="button" v-adaptive-border v-tooltip="checked ? i18n.ts.itsOn : i18n.ts.itsOff" class="button" @click.prevent="toggle">
		<i class="check fas fa-check"></i>
	</span>
	<span class="label">
		<!-- TODO: 無名slotの方は廃止 -->
		<span @click="toggle"><slot name="label"></slot><slot></slot></span>
		<p class="caption"><slot name="caption"></slot></p>
	</span>
</div>
</template>

<script lang="ts" setup>
import { toRefs, Ref } from 'vue';
import * as os from '@/os';
import Ripple from '@/components/MkRipple.vue';
import { i18n } from '@/i18n';

const props = defineProps<{
	modelValue: boolean | Ref<boolean>;
	disabled?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', v: boolean): void;
}>();

let button = $ref<HTMLElement>();
const checked = toRefs(props).modelValue;
const toggle = () => {
	if (props.disabled) return;
	emit('update:modelValue', !checked.value);

	if (!checked.value) {
		const rect = button.getBoundingClientRect();
		const x = rect.left + (button.offsetWidth / 2);
		const y = rect.top + (button.offsetHeight / 2);
		os.popup(Ripple, { x, y, particle: false }, {}, 'end');
	}
};
</script>

<style lang="scss" scoped>
.ziffeoms {
	position: relative;
	display: flex;
	transition: all 0.2s ease;

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
			transform: scale(0.5);
			transition: all 0.2s ease;
		}
	}

	&:hover {
		> .button {
			border-color: var(--inputBorderHover) !important;
		}
	}

	> .label {
		margin-left: 12px;
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
				transform: scale(1);
			}
		}
	}
}
</style>
