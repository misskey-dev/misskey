<template>
<div class="timctyfi" :class="{ focused, disabled }">
	<div class="icon"><slot name="icon"></slot></div>
	<span class="title"><slot name="title"></slot></span>
	<input
		type="range"
		ref="input"
		v-model="v"
		:disabled="disabled"
		:min="min"
		:max="max"
		:step="step"
		:autofocus="autofocus"
		@focus="focused = true"
		@blur="focused = false"
		@input="$emit('input', $event.target.value)"
	/>
</div>
</template>

<script lang="ts">
import Vue from "vue";
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
		autofocus: {
			type: Boolean,
			required: false
		}
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
	mounted() {
		if (this.autofocus) {
			this.$nextTick(() => {
				this.$refs.input.focus();
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.timctyfi {
	position: relative;
	margin: 8px;

	> .icon {
		display: inline-block;
		width: 24px;
		text-align: center;
	}

	> .title {
		pointer-events: none;
		font-size: 16px;
		color: var(--inputLabel);
		overflow: hidden;
	}

	> input {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		background: var(--X10);
		height: 7px;
		margin: 0 8px;
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
</style>
