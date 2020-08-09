<template>
<div
	class="novjtctn"
	:class="{ disabled, checked }"
	:aria-checked="checked"
	:aria-disabled="disabled"
	@click="toggle"
>
	<input type="radio"
		:disabled="disabled"
	>
	<span class="button">
		<span></span>
	</span>
	<span class="label"><slot></slot></span>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
	model: {
		prop: 'model',
		event: 'change'
	},
	props: {
		model: {
			required: false
		},
		value: {
			required: false
		},
		disabled: {
			type: Boolean,
			default: false
		}
	},
	computed: {
		checked(): boolean {
			return this.model === this.value;
		}
	},
	methods: {
		toggle() {
			if (this.disabled) return;
			this.$emit('change', this.value);
		}
	}
});
</script>

<style lang="scss" scoped>
.novjtctn {
	display: inline-block;
	margin: 0 32px 0 0;
	cursor: pointer;
	transition: all 0.3s;

	> * {
		user-select: none;
	}

	&.disabled {
		opacity: 0.6;

		&, * {
			cursor: not-allowed !important;
		}
	}

	&.checked {
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
		width: 20px;
		height: 20px;
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
		font-size: 16px;
		line-height: 20px;
		cursor: pointer;
	}
}
</style>
