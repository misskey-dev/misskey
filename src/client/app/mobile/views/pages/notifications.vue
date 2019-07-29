<template>
<mk-ui>
	<template #header><fa :icon="faBell"/> {{ $t('notifications') }}</template>
	<template #func>
		<button @click="filter()"><fa icon="cog"/></button>
	</template>

	<main>
		<mk-notifications @before-init="beforeInit()" @inited="inited()" :type="type === 'all' ? null : type" :wide="true" :class="{ shadow: $store.state.device.useShadow, round: $store.state.device.roundedCorners }"/>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/notifications.vue'),
	data() {
		return {
			type: 'all',
			faBell,
		};
	},
	methods: {
		beforeInit() {
			Progress.start();
		},
		inited() {
			Progress.done();
		},
		filter() {
			this.$root.dialog({
				title: this.$t('@.notification-type'),
				type: null,
				select: {
					items: ['all', 'follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'receiveFollowRequest'].map(x => ({
						value: x, text: this.$t('@.notification-types.' + x)
					}))
					default: this.type,
				},
				showCancelButton: true
			}).then(({ canceled, result: type }) => {
				if (canceled) return;
				this.type = type;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
main > *
	overflow hidden
	background var(--face)

	&.round
		border-radius 8px

	&.shadow
		box-shadow 0 4px 16px rgba(#000, 0.1)

		@media (min-width 500px)
			box-shadow 0 8px 32px rgba(#000, 0.1)
</style>
