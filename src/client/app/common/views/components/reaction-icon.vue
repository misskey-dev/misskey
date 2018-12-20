<template>
<span class="mk-reaction-icon">
	<img v-if="reaction == 'like'" src="https://twemoji.maxcdn.com/2/svg/1f44d.svg" :alt="$t('@.reactions.like')">
	<img v-if="reaction == 'love'" src="https://twemoji.maxcdn.com/2/svg/2764.svg" :alt="$t('@.reactions.love')">
	<img v-if="reaction == 'laugh'" src="https://twemoji.maxcdn.com/2/svg/1f606.svg" :alt="$t('@.reactions.laugh')">
	<img v-if="reaction == 'hmm'" src="https://twemoji.maxcdn.com/2/svg/1f914.svg" :alt="$t('@.reactions.hmm')">
	<img v-if="reaction == 'surprise'" src="https://twemoji.maxcdn.com/2/svg/1f62e.svg" :alt="$t('@.reactions.surprise')">
	<img v-if="reaction == 'congrats'" src="https://twemoji.maxcdn.com/2/svg/1f389.svg" :alt="$t('@.reactions.congrats')">
	<img v-if="reaction == 'angry'" src="https://twemoji.maxcdn.com/2/svg/1f4a2.svg" :alt="$t('@.reactions.angry')">
	<img v-if="reaction == 'confused'" src="https://twemoji.maxcdn.com/2/svg/1f625.svg" :alt="$t('@.reactions.confused')">
	<img v-if="reaction == 'rip'" src="https://twemoji.maxcdn.com/2/svg/1f607.svg" :alt="$t('@.reactions.rip')">
	<template v-if="reaction == 'pudding'">
		<img v-if="$store.getters.isSignedIn && $store.state.settings.iLikeSushi" src="https://twemoji.maxcdn.com/2/svg/1f363.svg" :alt="$t('@.reactions.pudding')">
		<img v-else src="https://twemoji.maxcdn.com/2/svg/1f36e.svg" :alt="$t('@.reactions.pudding')">
	</template>
</span>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
export default Vue.extend({
	i18n: i18n(),
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
