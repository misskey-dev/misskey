<template>
<div
	class="ui-switch"
	:class="{ disabled, checked }"
	role="switch"
	:aria-checked="checked"
	:aria-disabled="disabled"
	@click="switchValue"
	@mouseover="mouseenter"
>
	<input
		type="checkbox"
		@change="handleChange"
		ref="input"
		:disabled="disabled"
		@keydown.enter="switchValue"
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
	props: {
		value: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		}
	},/*
	created() {
		if (!~[true, false].indexOf(this.value)) {
			this.$emit('input', false);
		}
	},*/
	computed: {
		checked(): boolean {
			return this.value;
		}
	},
	watch: {
		value() {
			(this.$el).style.transition = 'all 0.3s';
			(this.$refs.input as any).checked = this.checked;
		}
	},
	mounted() {
		(this.$refs.input as any).checked = this.checked;
	},
	methods: {
		mouseenter() {
			(this.$el).style.transition = 'all 0s';
		},
		handleChange() {
			(this.$el).style.transition = 'all 0.3s';
			this.$emit('input', !this.checked);
			this.$emit('change', !this.checked);
			this.$nextTick(() => {
				// set input's checked property
				// in case parent refuses to change component's value
				(this.$refs.input as any).checked = this.checked;
			});
		},
		switchValue() {
			!this.disabled && this.handleChange();
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	display flex
	margin 32px 0
	cursor pointer
	transition all 0.3s

	> *
		user-select none

	&.disabled
		opacity 0.6
		cursor not-allowed

	&.checked
		> .button
			background-color rgba($theme-color, 0.4)
			border-color rgba($theme-color, 0.4)

			> *
				background-color $theme-color
				transform translateX(14px)

	> input
		position absolute
		width 0
		height 0
		opacity 0
		margin 0

	> .button
		display inline-block
		margin 3px 0 0 0
		width 34px
		height 14px
		background isDark ? rgba(#fff, 0.1) : rgba(#000, 0.05)
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
