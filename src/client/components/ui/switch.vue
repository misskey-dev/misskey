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
		type="checkbox"
		ref="input"
		:disabled="disabled"
		@keydown.enter="toggle"
	>
	<span class="button">
		<span></span>
	</span>
	<span class="label">
		<span><slot></slot></span>
		<p><slot name="desc"></slot></p>
	</span>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

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
.ziffeoms {
	position: relative;
	display: flex;
	margin: 32px 0;
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
		cursor: pointer;
		transition: inherit;
		color: var(--fg);

		> span {
			display: block;
			line-height: 20px;
			transition: inherit;
		}

		> p {
			margin: 0;
			opacity: 0.7;
			font-size: 90%;
		}
	}
}
</style>
