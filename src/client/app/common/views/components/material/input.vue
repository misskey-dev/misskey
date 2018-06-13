<template>
<div class="ui-input" :class="{ focused, filled }">
	<div class="input">
		<span class="label" ref="label"><slot></slot></span>
		<div class="prefix" ref="prefix" @click="focus"><slot name="prefix"></slot></div>
		<input ref="input" :value="value" @input="$emit('input', $event.target.value)" @focus="focused = true" @blur="focused = false">
		<div class="suffix" @click="focus"><slot name="suffix"></slot></div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['value'],
	data() {
		return {
			focused: false
		}
	},
	computed: {
		filled(): boolean {
			return this.value != '' && this.value != null;
		}
	},
	mounted() {
		this.$refs.label.style.left = (this.$refs.prefix.offsetLeft + this.$refs.prefix.offsetWidth) + 'px';
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
	margin-bottom 32px

	> .input
		display flex
		margin-top 16px
		padding 6px 12px
		background #f5f5f5
		border-radius 6px

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

		> .prefix
			padding-right 4px

		> .suffix
			padding-left 4px

	&.focused
		> .input
			background #eee

			> .label
				color $theme-color

	&.focused
	&.filled
		> .input
			> .label
				top -20px
				left 0 !important
				font-size 12px
				line-height 20px

</style>
