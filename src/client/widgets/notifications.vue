<template>
<mk-container :style="`height: ${props.height}px;`" :show-header="props.showHeader" :scrollable="true">
	<template #header><fa :icon="faBell"/>{{ $t('notifications') }}</template>

	<div>
		<x-notifications/>
	</div>
</mk-container>
</template>

<script lang="ts">
import { faBell } from '@fortawesome/free-solid-svg-icons';
import MkContainer from '../components/ui/container.vue';
import XNotifications from '../components/notifications.vue';
import define from './define';

export default define({
	name: 'notifications',
	props: () => ({
		showHeader: {
			type: 'boolean',
			default: true,
		},
		height: {
			type: 'number',
			default: 300,
		},
	})
}).extend({
	components: {
		MkContainer,
		XNotifications,
	},

	data() {
		return {
			faBell
		};
	},
});
</script>
