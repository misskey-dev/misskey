<template>
<div class="mkw-notifications">
	<mk-container :show-header="!props.compact">
		<template #header><fa :icon="faBell"/>{{ $t('notifications') }}</template>

		<div style="height: 300px; overflow: auto; background: var(--bg);">
			<x-notifications/>
		</div>
	</mk-container>
</div>
</template>

<script lang="ts">
import { faBell } from '@fortawesome/free-solid-svg-icons';
import MkContainer from '../components/ui/container.vue';
import XNotifications from '../components/notifications.vue';
import define from './define';
import i18n from '../i18n';

export default define({
	name: 'notifications',
	props: () => ({
		compact: false
	})
}).extend({
	i18n,
	
	components: {
		MkContainer,
		XNotifications,
	},

	data() {
		return {
			faBell
		};
	},

	methods: {
		func() {
			this.props.compact = !this.props.compact;
			this.save();
		},
	}
});
</script>
