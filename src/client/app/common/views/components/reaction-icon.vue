<template>
<span class="mk-reaction-icon">
	<img v-if="reaction == 'like'" src="/assets/reactions/like.png" alt="%i18n:common.reactions.like%">
	<img v-if="reaction == 'love'" src="/assets/reactions/love.png" alt="%i18n:common.reactions.love%">
	<img v-if="reaction == 'laugh'" src="/assets/reactions/laugh.png" alt="%i18n:common.reactions.laugh%">
	<img v-if="reaction == 'hmm'" src="/assets/reactions/hmm.png" alt="%i18n:common.reactions.hmm%">
	<img v-if="reaction == 'surprise'" src="/assets/reactions/surprise.png" alt="%i18n:common.reactions.surprise%">
	<img v-if="reaction == 'congrats'" src="/assets/reactions/congrats.png" alt="%i18n:common.reactions.congrats%">
	<img v-if="reaction == 'angry'" src="/assets/reactions/angry.png" alt="%i18n:common.reactions.angry%">
	<img v-if="reaction == 'confused'" src="/assets/reactions/confused.png" alt="%i18n:common.reactions.confused%">
	<img v-if="reaction == 'pudding'" src="/assets/reactions/pudding.png" alt="%i18n:common.reactions.pudding%">
</span>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['reaction']
});
</script>

<style lang="stylus" scoped>
.mk-reaction-icon
	img
		vertical-align middle
		width 1em
		height 1em
</style>
