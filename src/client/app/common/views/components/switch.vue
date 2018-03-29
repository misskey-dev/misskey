<template>
<div
	class="mk-switch"
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
		<span :style="{ transform }"></span>
	</span>
	<span class="label">
		<span :aria-hidden="!checked">{{ text }}</span>
		<p :aria-hidden="!checked">
			<slot></slot>
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
		},
		text: String
	},/*
	created() {
		if (!~[true, false].indexOf(this.value)) {
			this.$emit('input', false);
		}
	},*/
	computed: {
		checked(): boolean {
			return this.value;
		},
		transform(): string {
			return this.checked ? 'translate3d(20px, 0, 0)' : '';
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

.mk-switch
	display flex
	margin 12px 0
	cursor pointer
	transition all 0.3s

	> *
		user-select none

	&.disabled
		opacity 0.6
		cursor not-allowed

	&.checked
		> .button
			background-color $theme-color
			border-color $theme-color

		> .label
			> span
				color $theme-color

		&:hover
			> .label
				> span
					color darken($theme-color, 10%)

			> .button
				background darken($theme-color, 10%)
				border-color darken($theme-color, 10%)

	&:hover
		> .label
			> span
				color #2e3338

		> .button
			background #ced2da
			border-color #ced2da

	> input
		position absolute
		width 0
		height 0
		opacity 0
		margin 0

		&:focus + .button
			&:after
				content ""
				pointer-events none
				position absolute
				top -5px
				right -5px
				bottom -5px
				left -5px
				border 2px solid rgba($theme-color, 0.3)
				border-radius 14px

	> .button
		display inline-block
		margin 0
		width 40px
		min-width 40px
		height 20px
		min-height 20px
		background #dcdfe6
		border 1px solid #dcdfe6
		outline none
		border-radius 10px
		transition inherit

		> *
			position absolute
			top 1px
			left 1px
			border-radius 100%
			transition transform 0.3s
			width 16px
			height 16px
			background-color #fff

	> .label
		margin-left 8px
		display block
		font-size 15px
		cursor pointer
		transition inherit

		> span
			display block
			line-height 20px
			color #4a535a
			transition inherit

		> p
			margin 0
			//font-size 90%
			color #9daab3

</style>
