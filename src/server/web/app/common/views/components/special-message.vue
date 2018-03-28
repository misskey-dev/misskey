<template>
<div class="mk-special-message">
	<p v-if="m == 1 && d == 1">%i18n:common.tags.mk-special-message.new-year%</p>
	<p v-if="m == 12 && d == 25">%i18n:common.tags.mk-special-message.christmas%</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	data() {
		return {
			now: new Date()
		};
	},
	computed: {
		d(): number {
			return this.now.getDate();
		},
		m(): number {
			return this.now.getMonth() + 1;
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-special-message
	&:empty
		display none

	> p
		margin 0
		padding 4px
		text-align center
		font-size 14px
		font-weight bold
		text-transform uppercase
		color #fff
		background #ff1036

</style>
