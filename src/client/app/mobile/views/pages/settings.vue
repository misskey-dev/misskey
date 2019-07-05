<template>
<mk-ui>
	<template #header><span style="margin-right:4px;"><fa icon="cog"/></span>{{ $t('@.settings') }}</template>
	<main>
		<div class="signed-in-as" :class="{ shadow: $store.state.device.useShadow, round: $store.state.device.roundedCorners }">
			<mfm :text="$t('signed-in-as').replace('{}', name)" :plain="true" :custom-emojis="$store.state.i.emojis"/>
		</div>

		<x-settings/>

		<div class="signout" :class="{ shadow: $store.state.device.useShadow, round: $store.state.device.roundedCorners }" @click="signout">{{ $t('@.signout') }}</div>

		<footer>
			<small>ver {{ version }} ({{ codename }})</small>
		</footer>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XSettings from '../../../common/views/components/settings/settings.vue';
import { version, codename } from '../../../config';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/settings.vue'),
	components: {
		XSettings,
	},
	data() {
		return {
			version,
			codename,
		};
	},
	computed: {
		name(): string {
			return Vue.filter('userName')(this.$store.state.i);
		},
	},
	methods: {
		signout() {
			this.$root.signout();
		},
	}
});
</script>

<style lang="stylus" scoped>
main

	> .signed-in-as
		margin 16px
		padding 16px
		text-align center
		color var(--mobileSignedInAsFg)
		background var(--mobileSignedInAsBg)
		font-weight bold

		&.round
			border-radius 6px

		&.shadow
			box-shadow 0 3px 1px -2px rgba(#000, 0.2), 0 2px 2px 0 rgba(#000, 0.14), 0 1px 5px 0 rgba(#000, 0.12)

	> .signout
		margin 16px
		padding 16px
		text-align center
		color var(--mobileSignedInAsFg)
		background var(--mobileSignedInAsBg)

		&.round
			border-radius 6px

		&.shadow
			box-shadow 0 3px 1px -2px rgba(#000, 0.2), 0 2px 2px 0 rgba(#000, 0.14), 0 1px 5px 0 rgba(#000, 0.12)

	> footer
		margin 16px
		text-align center
		color var(--text)
		opacity 0.7

</style>
