<template>
<div class="ui-textarea" :class="{ focused, filled }">
	<div class="input">
		<span class="label" ref="label"><slot></slot></span>
		<textarea ref="input"
				:value="value"
				:required="required"
				:readonly="readonly"
				:pattern="pattern"
				:autocomplete="autocomplete"
				@input="$emit('input', $event.target.value)"
				@focus="focused = true"
				@blur="focused = false">
		</textarea>
	</div>
	<div class="text"><slot name="text"></slot></div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
const getPasswordStrength = require('syuilo-password-strength');

export default Vue.extend({
	props: {
		value: {
			required: false
		},
		required: {
			type: Boolean,
			required: false
		},
		readonly: {
			type: Boolean,
			required: false
		},
		pattern: {
			type: String,
			required: false
		},
		autocomplete: {
			type: String,
			required: false
		}
	},
	data() {
		return {
			focused: false,
			passwordStrength: ''
		}
	},
	computed: {
		filled(): boolean {
			return this.value != '' && this.value != null;
		}
	},
	methods: {
		focus() {
			this.$refs.input.focus();
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.ui-textarea
	margin 32px 0

	> .input
		padding 12px
		background rgba(#000, 0.035)
		border-radius 6px

		> .label
			position absolute
			top 6px
			left 12px
			pointer-events none
			transition 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)
			transition-duration 0.3s
			font-size 16px
			line-height 32px
			color rgba(#000, 0.54)
			pointer-events none
			//will-change transform
			transform-origin top left
			transform scale(1)

		> textarea
			display block
			width 100%
			min-height 100px
			padding 0
			font inherit
			font-weight bold
			font-size 16px
			background transparent
			border none
			border-radius 0
			outline none
			box-shadow none

	> .text
		margin 6px 0
		font-size 13px

		*
			margin 0

	&.focused
		> .input
			background rgba(#000, 0.05)

			> .label
				color $theme-color

	&.focused
	&.filled
		> .input
			> .label
				top -24px
				left 0 !important
				transform scale(0.8)

</style>
