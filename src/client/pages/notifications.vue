<template>
<div class="_root">
	<XNotifications class="_content" @before="before" @after="after" page/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import Progress from '@client/scripts/loading';
import XNotifications from '@client/components/notifications.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		XNotifications
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
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
