<template>
<div class="ui-input" :class="[{ focused, filled, inline, disabled }, styl]">
	<div class="icon" ref="icon"><slot name="icon"></slot></div>
	<div class="input">
		<div class="password-meter" v-if="withPasswordMeter" v-show="passwordStrength != ''" :data-strength="passwordStrength">
			<div class="value" ref="passwordMetar"></div>
		</div>
		<span class="label" ref="label"><slot></slot></span>
		<span class="title" ref="title"><slot name="title"></slot></span>
		<div class="prefix" ref="prefix"><slot name="prefix"></slot></div>
		<template v-if="type != 'file'">
			<input v-if="debounce" ref="input"
				v-debounce="500"
				:type="type"
				v-model.lazy="v"
				:disabled="disabled"
				:required="required"
				:readonly="readonly"
				:placeholder="placeholder"
				:pattern="pattern"
				:autocomplete="autocomplete"
				:spellcheck="spellcheck"
				@focus="focused = true"
				@blur="focused = false"
				@keydown="$emit('keydown', $event)"
			>
			<input v-else ref="input"
				:type="type"
				v-model="v"
				:disabled="disabled"
				:required="required"
				:readonly="readonly"
				:placeholder="placeholder"
				:pattern="pattern"
				:autocomplete="autocomplete"
				:spellcheck="spellcheck"
				@focus="focused = true"
				@blur="focused = false"
				@keydown="$emit('keydown', $event)"
			>
		</template>
		<template v-else>
			<input ref="input"
				type="text"
				:value="filePlaceholder"
				readonly
				@click="chooseFile"
			>
			<input ref="file"
				type="file"
				:value="value"
				@change="onChangeFile"
			>
		</template>
		<div class="suffix" ref="suffix"><slot name="suffix"></slot></div>
	</div>
	<div class="toggle" v-if="withPasswordToggle">
		<a @click='togglePassword'>
			<span v-if="type == 'password'"><fa :icon="['fa', 'eye']"/> {{ $t('@.show-password') }}</span>
			<span v-if="type != 'password'"><fa :icon="['far', 'eye-slash']"/> {{ $t('@.hide-password') }}</span>
		</a>
	</div>
	<div class="desc"><slot name="desc"></slot></div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import debounce from 'v-debounce';
const getPasswordStrength = require('syuilo-password-strength');

export default Vue.extend({
	directives: {
		debounce
	},
	inject: {
		horizonGrouped: {
			default: false
		}
	},
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
		disabled: {
			type: Boolean,
			required: false
		},
		pattern: {
			type: String,
			required: false
		},
		placeholder: {
			type: String,
			required: false
		},
		autofocus: {
			type: Boolean,
			required: false,
			default: false
		},
		autocomplete: {
			required: false
		},
		spellcheck: {
			required: false
		},
		debounce: {
			required: false
		},
		withPasswordMeter: {
			type: Boolean,
			required: false,
			default: false
		},
		withPasswordToggle: {
			type: Boolean,
			required: false,
			default: false
		},
		inline: {
			type: Boolean,
			required: false,
			default(): boolean {
				return this.horizonGrouped;
			}
		},
		styl: {
			type: String,
			required: false,
			default: 'line'
		}
	},
	data() {
		return {
			v: this.value,
			focused: false,
			passwordStrength: ''
		};
	},
	computed: {
		filled(): boolean {
			return this.v != '' && this.v != null;
		},
		filePlaceholder(): string {
			if (this.type != 'file') return null;
			if (this.v == null) return null;

			if (typeof this.v == 'string') return this.v;

			if (Array.isArray(this.v)) {
				return this.v.map(file => file.name).join(', ');
			} else {
				return this.v.name;
			}
		}
	},
	watch: {
		value(v) {
			this.v = v;
		},
		v(v) {
			this.$emit('input', v);

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
		if (this.autofocus) {
			this.$nextTick(() => {
				this.$refs.input.focus();
			});
		}

		this.$nextTick(() => {
			if (this.$refs.prefix) {
				this.$refs.label.style.left = (this.$refs.prefix.offsetLeft + this.$refs.prefix.offsetWidth) + 'px';
				if (this.$refs.prefix.offsetWidth) {
					this.$refs.input.style.paddingLeft = this.$refs.prefix.offsetWidth + 'px';
				}
			}
			if (this.$refs.suffix) {
				if (this.$refs.suffix.offsetWidth) {
					this.$refs.input.style.paddingRight = this.$refs.suffix.offsetWidth + 'px';
				}
			}
		});

		this.$on('keydown', (e: KeyboardEvent) => {
			if (e.code == 'Enter') {
				this.$emit('enter');
			}
		});
	},
	methods: {
		focus() {
			this.$refs.input.focus();
		},
		togglePassword() {
			if (this.type == 'password') {
				this.type = 'text'
			} else {
				this.type = 'password'
			}
		},
		chooseFile() {
			this.$refs.file.click();
		},
		onChangeFile() {
			this.v = Array.from((this.$refs.file as any).files);
			this.$emit('input', this.v);
			this.$emit('change', this.v);
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

		if !fill
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
			z-index 1
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

		> .title
			position absolute
			z-index 1
			top fill ? -24px : -17px
			left 0 !important
			pointer-events none
			font-size 16px
			line-height 32px
			color var(--inputLabel)
			pointer-events none
			//will-change transform
			transform-origin top left
			transform scale(.75)

		> input
			display block
			width 100%
			margin 0
			padding 0
			font inherit
			font-weight fill ? bold : normal
			font-size 16px
			line-height 32px
			color var(--inputText)
			background transparent
			border none
			border-radius 0
			outline none
			box-shadow none

			if fill
				padding 6px 12px
				background rgba(#000, 0.035)
				border-radius 6px

			&[type='file']
				display none

		> .prefix
		> .suffix
			display block
			position absolute
			z-index 1
			top 0
			font-size 16px
			line-height fill ? 44px : 32px
			color var(--inputLabel)
			pointer-events none

			&:empty
				display none

			> *
				display inline-block
				min-width 16px
				max-width 150px
				overflow hidden
				white-space nowrap
				text-overflow ellipsis

		> .prefix
			left 0
			padding-right 4px

			if fill
				padding-left 12px

		> .suffix
			right 0
			padding-left 4px

			if fill
				padding-right 12px

	> .toggle
		cursor pointer
		padding-left 0.5em
		font-size 0.7em
		opacity 0.7
		text-align left

		> a
			color var(--inputLabel)
			text-decoration none

	> .desc
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

.ui-input
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
