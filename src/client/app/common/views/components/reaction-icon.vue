<template>
<mfm :text="str" :should-break="false" :plain-text="true"/>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
export default Vue.extend({
	i18n: i18n(),
	props: {
		reaction: {
			type: String,
			required: true
		},
	},
	computed: {
		str(): any {
			switch (this.reaction) {
				case 'like': return '👍';
				case 'love': return '❤';
				case 'laugh': return '😆';
				case 'hmm': return '🤔';
				case 'surprise': return '😮';
				case 'congrats': return '🎉';
				case 'angry': return '💢';
				case 'confused': return '😥';
				case 'rip': return '😇';
				case 'pudding': return (this.$store.getters.isSignedIn && this.$store.state.settings.iLikeSushi) ? '🍣' : '🍮';
				case 'star': return '⭐';
				default: return this.reaction;
			}
		},
	},
});
</script>

<style lang="stylus" scoped>
.mk-reaction-icon
	img
		vertical-align middle
		width 1em
		height 1em
</style>
