<template>
<div class="mkw-memo">
	<mk-widget-container :show-header="!props.compact">
		<template slot="header">%fa:R sticky-note%%i18n:@title%</template>

		<div class="mkw-memo--body">
			<textarea v-model="text" placeholder="%i18n:@memo%" @input="onChange"></textarea>
			<button @click="saveMemo" :disabled="!changed">%i18n:@save%</button>
		</div>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../define-widget';

export default define({
	name: 'memo',
	props: () => ({
		compact: false
	})
}).extend({
	data() {
		return {
			text: null,
			changed: false
		};
	},

	created() {
		this.text = this.$store.state.settings.memo;

		this.$watch('$store.state.settings.memo', text => {
			this.text = text;
		});
	},

	methods: {
		func() {
			this.props.compact = !this.props.compact;
			this.save();
		},

		onChange() {
			this.changed = true;
		},

		saveMemo() {
			this.$store.dispatch('settings/set', {
				key: 'memo',
				value: this.text
			});
			this.changed = false;
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	.mkw-memo--body
		padding-bottom 28px + 16px

		> textarea
			display block
			width 100%
			max-width 100%
			min-width 100%
			padding 16px
			color isDark ? #fff : #222
			background isDark ? #282c37 : #fff
			border none
			border-bottom solid 1px isDark ? #1c2023 : #eee

		> button
			display block
			position absolute
			bottom 8px
			right 8px
			margin 0
			padding 0 10px
			height 28px
			color $theme-color-foreground
			background $theme-color !important
			outline none
			border none
			border-radius 4px
			transition background 0.1s ease
			cursor pointer

			&:hover
				background lighten($theme-color, 10%) !important

			&:active
				background darken($theme-color, 10%) !important
				transition background 0s ease

			&:disabled
				opacity 0.7
				cursor default

.mkw-memo[data-darkmode]
	root(true)

.mkw-memo:not([data-darkmode])
	root(false)

</style>
