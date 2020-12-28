<template>
<div>
	<div class="_section">
		<XNotifications class="_content" @before="before" @after="after" page/>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import Progress from '@/scripts/loading';
import XNotifications from '@/components/notifications.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XNotifications
	},

	data() {
		return {
			INFO: {
				title: this.$ts.notifications,
				icon: faBell
			},
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
