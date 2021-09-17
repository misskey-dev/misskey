<template>
<div class="clupoqwt" v-size="{ min: [800] }">
	<XNotifications class="notifications" @before="before" @after="after" page/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
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
				icon: 'fas fa-bell',
				bg: 'var(--bg)',
				actions: [{
					text: this.$ts.markAllAsRead,
					icon: 'fas fa-check',
					handler: () => {
						os.apiWithDialog('notifications/mark-all-as-read');
					}
				}]
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

<style lang="scss" scoped>
.clupoqwt {
	&.min-width_800px {
		background: var(--bg);
		padding: 32px 0;

		> .notifications {
			max-width: 800px;
			margin: 0 auto;
		}
	}
}
</style>
