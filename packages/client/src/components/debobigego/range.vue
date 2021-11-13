<template>
<div class="ifitouly _debobigegoItem" :class="{ focused, disabled }">
	<div class="_debobigegoLabel"><slot name="label"></slot></div>
	<div class="_debobigegoPanel main">
		<input
			type="range"
			ref="input"
			v-model="v"
			:disabled="disabled"
			:min="min"
			:max="max"
			:step="step"
			@focus="focused = true"
			@blur="focused = false"
			@input="$emit('update:value', $event.target.value)"
		/>
	</div>
	<div class="_debobigegoCaption"><slot name="caption"></slot></div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		value: {
			type: Number,
			required: false,
			default: 0
		},
		disabled: {
			type: Boolean,
			required: false,
			default: false
		},
		min: {
			type: Number,
			required: false,
			default: 0
		},
		max: {
			type: Number,
			required: false,
			default: 100
		},
		step: {
			type: Number,
			required: false,
			default: 1
		},
	},
	data() {
		return {
			v: this.value,
			focused: false
		};
	},
	watch: {
		value(v) {
			this.v = parseFloat(v);
		}
	},
});
</script>

<style lang="scss" scoped>
.ifitouly {
	position: relative;

	> .main {
		padding: 22px 16px;

		> input {
			display: block;
			-webkit-appearance: none;
			-moz-appearance: none;
			appearance: none;
			background: var(--X10);
			height: 4px;
			width: 100%;
			box-sizing: border-box;
			margin: 0;
			outline: 0;
			border: 0;
			border-radius: 7px;

			&.disabled {
				opacity: 0.6;
				cursor: not-allowed;
			}

			&::-webkit-slider-thumb {
				-webkit-appearance: none;
				appearance: none;
				cursor: pointer;
				width: 20px;
				height: 20px;
				display: block;
				border-radius: 50%;
				border: none;
				background: var(--accent);
				box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);
				box-sizing: content-box;
			}

			&::-moz-range-thumb {
				-moz-appearance: none;
				appearance: none;
				cursor: pointer;
				width: 20px;
				height: 20px;
				display: block;
				border-radius: 50%;
				border: none;
				background: var(--accent);
				box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);
			}
		}
	}
}
</style>
