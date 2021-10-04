<template>
<div class="ijnpvmgr _debobigegoItem">
	<div class="main _debobigegoPanel _debobigegoClickable"
		:class="{ disabled, checked }"
		:aria-checked="checked"
		:aria-disabled="disabled"
		@click.prevent="toggle"
	>
		<input
			type="checkbox"
			ref="input"
			:disabled="disabled"
			@keydown.enter="toggle"
		>
		<span class="button" v-tooltip="checked ? $ts.itsOn : $ts.itsOff">
			<span class="handle"></span>
		</span>
		<span class="label">
			<span><slot></slot></span>
		</span>
	</div>
	<div class="_debobigegoCaption"><slot name="desc"></slot></div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import './debobigego.scss';

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
.ijnpvmgr {
	> .main {
		position: relative;
		display: flex;
		padding: 14px 16px;
		cursor: pointer;

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
			width: 34px;
			height: 22px;
			background: var(--switchBg);
			outline: none;
			border-radius: 999px;
			transition: all 0.3s;
			cursor: pointer;

			> .handle {
				position: absolute;
				top: 0;
				left: 3px;
				bottom: 0;
				margin: auto 0;
				border-radius: 100%;
				transition: background-color 0.3s, transform 0.3s;
				width: 16px;
				height: 16px;
				background-color: #fff;
				pointer-events: none;
			}
		}

		> .label {
			margin-left: 12px;
			display: block;
			transition: inherit;
			color: var(--fg);

			> span {
				display: block;
				line-height: 20px;
				transition: inherit;
			}
		}

		&.disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}

		&.checked {
			> .button {
				background-color: var(--accent);

				> .handle {
					transform: translateX(12px);
				}
			}
		}
	}
}
</style>
