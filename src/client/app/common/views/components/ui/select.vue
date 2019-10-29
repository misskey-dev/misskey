<template>
<div class="ui-select" :class="[{ focused, disabled, filled, inline }, styl]">
	<div class="icon" ref="icon"><slot name="icon"></slot></div>
	<div class="input" @click="focus">
		<span class="label" ref="label"><slot name="label"></slot></span>
		<div class="prefix" ref="prefix"><slot name="prefix"></slot></div>
		<select ref="input"
			v-model="v"
			:required="required"
			:disabled="disabled"
			@focus="focused = true"
			@blur="focused = false"
		>
			<slot></slot>
		</select>
		<div class="suffix"><slot name="suffix"></slot></div>
	</div>
	<div class="text"><slot name="text"></slot></div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	inject: {
		horizonGrouped: {
			default: false
		}
	},
	props: {
		value: {
			required: false
		},
		required: {
			type: Boolean,
			required: false
		},
		disabled: {
			type: Boolean,
			required: false
		},
		styl: {
			type: String,
			required: false,
			default: 'line'
		},
		inline: {
			type: Boolean,
			required: false,
			default(): boolean {
				return this.horizonGrouped;
			}
		},
	},
	data() {
		return {
			focused: false
		};
	},
	computed: {
		v: {
			get() {
				return this.value;
			},
			set(v) {
				this.$emit('input', v);
			}
		},
		filled(): boolean {
			return this.v != '' && this.v != null;
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
root(fill)
	margin 32px 0

	> .icon
		position absolute
		top 0
		left 0
		width 24px
		text-align center
		line-height 32px
		color var(--inputLabel)

		&:not(:empty) + .input
			margin-left 28px

	> .input
		display flex

		if fill
			padding 6px 12px
			background rgba(#000, 0.035)
			border-radius 6px
		else
			&:before
				content ''
				display block
				position absolute
				bottom 0
				left 0
				right 0
				height 1px
				background var(--inputBorder)

			&:after
				content ''
				display block
				position absolute
				bottom 0
				left 0
				right 0
				height 2px
				background var(--primary)
				opacity 0
				transform scaleX(0.12)
				transition border 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)
				will-change border opacity transform

		> .label
			position absolute
			top fill ? 6px : 0
			left 0
			pointer-events none
			transition 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)
			transition-duration 0.3s
			font-size 16px
			line-height 32px
			color var(--inputLabel)
			pointer-events none
			//will-change transform
			transform-origin top left
			transform scale(1)

		> select
			display block
			flex 1
			width 100%
			padding 0
			font inherit
			font-weight fill ? bold : normal
			font-size 16px
			height 32px
			color var(--inputText)
			background transparent
			border none
			border-radius 0
			outline none
			box-shadow none

			*
				color #000

		> .prefix
		> .suffix
			display block
			align-self center
			justify-self center
			font-size 16px
			line-height 32px
			color rgba(#000, 0.54)
			pointer-events none

			&:empty
				display none

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

		&:empty
			display none

		*
			margin 0

	&.focused
		> .input
			if fill
				background rgba(#000, 0.05)
			else
				&:after
					opacity 1
					transform scaleX(1)

			> .label
				color var(--primary)

	&.focused
	&.filled
		> .input
			> .label
				top fill ? -24px : -17px
				left 0 !important
				transform scale(0.75)

.ui-select
	&.fill
		root(true)
	&:not(.fill)
		root(false)

	&.inline
		display inline-block
		margin 0

	&.disabled
		opacity 0.7

		&, *
			cursor not-allowed !important

</style>
