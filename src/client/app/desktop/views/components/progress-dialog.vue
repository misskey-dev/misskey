<template>
<mk-window ref="window" :is-modal="false" :can-close="false" width="500px" @closed="$destroy">
	<span slot="header">{{ title }}<mk-ellipsis/></span>
	<div :class="$style.body">
		<p :class="$style.init" v-if="isNaN(value)">%i18n:@waiting%<mk-ellipsis/></p>
		<p :class="$style.percentage" v-if="!isNaN(value)">{{ Math.floor((value / max) * 100) }}</p>
		<progress :class="$style.progress"
			v-if="!isNaN(value) && value < max"
			:value="isNaN(value) ? 0 : value"
			:max="max"
		></progress>
		<div :class="[$style.progress, $style.waiting]" v-if="value >= max"></div>
	</div>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['title', 'initValue', 'initMax'],
	data() {
		return {
			value: this.initValue,
			max: this.initMax
		};
	},
	methods: {
		update(value, max) {
			this.value = parseInt(value, 10);
			this.max = parseInt(max, 10);
		},
		close() {
			(this.$refs.window as any).close();
		}
	}
});
</script>

<style lang="stylus" module>
@import '~const.styl'

.body
	padding 18px 24px 24px 24px

.init
	display block
	margin 0
	text-align center
	color rgba(#000, 0.7)

.percentage
	display block
	margin 0 0 4px 0
	text-align center
	line-height 16px
	color rgba($theme-color, 0.7)

	&:after
		content '%'

.progress
	display block
	margin 0
	width 100%
	height 10px
	background transparent
	border none
	border-radius 4px
	overflow hidden

	&::-webkit-progress-value
		background $theme-color

	&::-webkit-progress-bar
		background rgba($theme-color, 0.1)

.waiting
	background linear-gradient(
		45deg,
		lighten($theme-color, 30%) 25%,
		$theme-color               25%,
		$theme-color               50%,
		lighten($theme-color, 30%) 50%,
		lighten($theme-color, 30%) 75%,
		$theme-color               75%,
		$theme-color
	)
	background-size 32px 32px
	animation progress-dialog-tag-progress-waiting 1.5s linear infinite

	@keyframes progress-dialog-tag-progress-waiting
		from {background-position: 0 0;}
		to   {background-position: -64px 32px;}

</style>
