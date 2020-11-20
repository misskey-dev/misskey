<template>
<div class="ijnpvmgr _form_item">
	<div class="main _form_panel"
		:class="{ disabled, checked }"
		:aria-checked="checked"
		:aria-disabled="disabled"
	>
		<input
			type="checkbox"
			ref="input"
			:disabled="disabled"
			@keydown.enter="toggle"
		>
		<span class="button" @click.prevent="toggle">
			<span></span>
		</span>
		<span class="label">
			<span><slot></slot></span>
		</span>
	</div>
	<div class="_form_caption"><slot name="desc"></slot></div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import './form.scss';

export default defineComponent({
	props: {
		value: {
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
			return this.value;
		}
	},
	methods: {
		toggle() {
			if (this.disabled) return;
			this.$emit('update:value', !this.checked);
		}
	}
});
</script>

<style lang="scss" scoped>
.ijnpvmgr {
	> .main {
		position: relative;
		display: flex;
		padding: 16px;
		transition: all 0.3s;

		> * {
			user-select: none;
		}

		&.disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}

		&.checked {
			> .button {
				background-color: var(--X10);
				border-color: var(--X10);

				> * {
					background-color: var(--accent);
					transform: translateX(14px);
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
			position: relative;
			display: inline-block;
			flex-shrink: 0;
			margin: 3px 0 0 0;
			width: 34px;
			height: 14px;
			background: var(--X6);
			outline: none;
			border-radius: 14px;
			transition: inherit;
			cursor: pointer;

			> * {
				position: absolute;
				top: -3px;
				left: 0;
				border-radius: 100%;
				transition: background-color 0.3s, transform 0.3s;
				width: 20px;
				height: 20px;
				background-color: #fff;
				box-shadow: 0 2px 1px -1px rgba(#000, 0.2), 0 1px 1px 0 rgba(#000, 0.14), 0 1px 3px 0 rgba(#000, 0.12);
			}
		}

		> .label {
			margin-left: 8px;
			display: block;
			transition: inherit;
			color: var(--fg);

			> span {
				display: block;
				line-height: 20px;
				transition: inherit;
			}
		}
	}
}
</style>
