<template>
<div
	class="ui-switch"
	:class="{ disabled, checked }"
	role="switch"
	:aria-checked="checked"
	:aria-disabled="disabled"
	@click="toggle"
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
		<span :aria-hidden="!checked"><slot></slot></span>
		<p :aria-hidden="!checked">
			<slot name="text"></slot>
		</p>
	</span>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	model: {
		prop: 'value',
		event: 'change'
	},
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
			this.$emit('change', !this.checked);
		}
	}
});
</script>

<style lang="stylus" scoped>


root(isDark)
	display flex
	margin 32px 0
	cursor pointer
	transition all 0.3s

	&:first-child
		margin-top 0

	&:last-child
		margin-bottom 0

	> *
		user-select none

	&.disabled
		opacity 0.6
		cursor not-allowed

	&.checked
		> .button
			background-color var(--primaryAlpha04)
			border-color var(--primaryAlpha04)

			> *
				background-color var(--primary)
				transform translateX(14px)

	> input
		position absolute
		width 0
		height 0
		opacity 0
		margin 0

	> .button
		display inline-block
		flex-shrink 0
		margin 3px 0 0 0
		width 34px
		height 14px
		background isDark ? rgba(#fff, 0.15) : rgba(#000, 0.25)
		outline none
		border-radius 14px
		transition inherit

		> *
			position absolute
			top -3px
			left 0
			border-radius 100%
			transition background-color 0.3s, transform 0.3s
			width 20px
			height 20px
			background-color #fff
			box-shadow 0 2px 1px -1px rgba(#000, 0.2), 0 1px 1px 0 rgba(#000, 0.14), 0 1px 3px 0 rgba(#000, 0.12)

	> .label
		margin-left 8px
		display block
		font-size 16px
		cursor pointer
		transition inherit

		> span
			display block
			line-height 20px
			color isDark ? #c4ccd2 : rgba(#000, 0.75)
			transition inherit

		> p
			margin 0
			//font-size 90%
			color isDark ? #78858e : #9daab3

.ui-switch[data-darkmode]
	root(true)

.ui-switch:not([data-darkmode])
	root(false)

</style>
