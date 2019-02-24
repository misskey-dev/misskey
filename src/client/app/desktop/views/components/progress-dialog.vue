<template>
<mk-window ref="window" :is-modal="false" :can-close="false" width="500px" @closed="destroyDom">
	<template #header>{{ title }}<mk-ellipsis/></template>
	<div :class="$style.body">
		<p :class="$style.init" v-if="isNaN(value)">{{ $t('waiting') }}<mk-ellipsis/></p>
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
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('desktop/views/components/progress-dialog.vue'),
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
	color var(--primaryAlpha07)

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
		background var(--primary)

	&::-webkit-progress-bar
		background var(--primaryAlpha01)

.waiting
	background linear-gradient(
		45deg,
		var(--primaryLighten30) 25%,
		var(--primary)               25%,
		var(--primary)               50%,
		var(--primaryLighten30) 50%,
		var(--primaryLighten30) 75%,
		var(--primary)               75%,
		var(--primary)
	)
	background-size 32px 32px
	animation progress-dialog-tag-progress-waiting 1.5s linear infinite

	@keyframes progress-dialog-tag-progress-waiting
		from {background-position: 0 0;}
		to   {background-position: -64px 32px;}

</style>
