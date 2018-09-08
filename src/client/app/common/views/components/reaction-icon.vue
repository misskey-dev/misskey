<template>
<span class="mk-reaction-icon">
	<img v-if="reaction == 'like'" src="https://twemoji.maxcdn.com/2/svg/1f44d.svg" alt="%i18n:common.reactions.like%">
	<img v-if="reaction == 'love'" src="https://twemoji.maxcdn.com/2/svg/2764.svg" alt="%i18n:common.reactions.love%">
	<img v-if="reaction == 'laugh'" src="https://twemoji.maxcdn.com/2/svg/1f606.svg" alt="%i18n:common.reactions.laugh%">
	<img v-if="reaction == 'hmm'" src="https://twemoji.maxcdn.com/2/svg/1f914.svg" alt="%i18n:common.reactions.hmm%">
	<img v-if="reaction == 'surprise'" src="https://twemoji.maxcdn.com/2/svg/1f62e.svg" alt="%i18n:common.reactions.surprise%">
	<img v-if="reaction == 'congrats'" src="https://twemoji.maxcdn.com/2/svg/1f389.svg" alt="%i18n:common.reactions.congrats%">
	<img v-if="reaction == 'angry'" src="https://twemoji.maxcdn.com/2/svg/1f4a2.svg" alt="%i18n:common.reactions.angry%">
	<img v-if="reaction == 'confused'" src="https://twemoji.maxcdn.com/2/svg/1f622.svg" alt="%i18n:common.reactions.confused%">
	<img v-if="reaction == 'rip'" src="https://twemoji.maxcdn.com/2/svg/1f607.svg" alt="%i18n:common.reactions.rip%">
	<template v-if="reaction == 'pudding'">
		<img v-if="$store.getters.isSignedIn && $store.state.settings.iLikeSushi" src="https://twemoji.maxcdn.com/2/svg/1f363.svg" alt="%i18n:common.reactions.pudding%">
		<img v-else src="https://twemoji.maxcdn.com/2/svg/1f36e.svg" alt="%i18n:common.reactions.pudding%">
	</template>
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
