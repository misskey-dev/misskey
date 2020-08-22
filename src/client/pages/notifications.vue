<template>
<div>
	<teleport to="#_teleport_header"><fa :icon="faBell"/>{{ $t('notifications') }}</teleport>
	<x-notifications @before="before" @after="after" page/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import Progress from '../scripts/loading';
import XNotifications from '../components/notifications.vue';

export default defineComponent({
	metaInfo() {
		return {
			title: this.$t('notifications') as string
		};
	},

	components: {
		XNotifications
	},

	data() {
		return {
			faBell
		};
	},

	methods: {
		before() {
			Progress.start();
		},

		after() {
			Progress.done();
		}
	}
});
</script>
