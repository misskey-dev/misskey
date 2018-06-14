<template>
<div class="ui-input" :class="{ focused, filled }">
	<div class="input" @click="focus">
		<div class="password-meter" v-if="withPasswordMeter" v-show="passwordStrength != ''" :data-strength="passwordStrength">
			<div class="value" ref="passwordMetar"></div>
		</div>
		<span class="label" ref="label"><slot></slot></span>
		<div class="prefix" ref="prefix"><slot name="prefix"></slot></div>
		<input ref="input"
				:type="type"
				:value="value"
				:required="required"
				:readonly="readonly"
				:pattern="pattern"
				:autocomplete="autocomplete"
				@input="$emit('input', $event.target.value)"
				@focus="focused = true"
				@blur="focused = false">
		<div class="suffix"><slot name="suffix"></slot></div>
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
		type: {
			type: String,
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
		},
		withPasswordMeter: {
			type: Boolean,
			required: false,
			default: false
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
	watch: {
		value(v) {
			if (this.withPasswordMeter) {
				if (v == '') {
					this.passwordStrength = '';
					return;
				}

				const strength = getPasswordStrength(v);
				this.passwordStrength = strength > 0.7 ? 'high' : strength > 0.3 ? 'medium' : 'low';
				(this.$refs.passwordMetar as any).style.width = `${strength * 100}%`;
			}
		}
	},
	mounted() {
		if (this.$refs.prefix) {
			this.$refs.label.style.left = (this.$refs.prefix.offsetLeft + this.$refs.prefix.offsetWidth) + 'px';
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

.ui-input
	margin 32px 0

	> .input
		display flex
		padding 6px 12px
		background rgba(#000, 0.035)
		border-radius 6px

		> .password-meter
			position absolute
			top 0
			left 0
			width 100%
			height 100%
			border-radius 6px
			overflow hidden
			opacity 0.3

			&[data-strength='']
				display none

			&[data-strength='low']
				> .value
					background #d73612

			&[data-strength='medium']
				> .value
					background #d7ca12

			&[data-strength='high']
				> .value
					background #61bb22

			> .value
				display block
				width 0%
				height 100%
				background transparent
				border-radius 6px
				transition all 0.1s ease

		> .label
			position absolute
			top 6px
			left 0
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

		> input
			display block
			flex 1
			width 100%
			padding 0
			font inherit
			font-weight bold
			font-size 16px
			line-height 32px
			background transparent
			border none
			border-radius 0
			outline none
			box-shadow none

		> .prefix
		> .suffix
			display block
			align-self center
			justify-self center
			font-size 16px
			line-height 32px
			color rgba(#000, 0.54)
			pointer-events none

			> *
				display block
				min-width 16px

		> .prefix
			padding-right 4px

		> .suffix
			padding-left 4px

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
