<template>
<div class="_formRoot">
	<FormLink class="_formBlock" @click="configure"><template #icon><i class="fas fa-cog"></i></template>{{ $ts.notificationSetting }}</FormLink>
	<FormSection>
		<FormLink class="_formBlock" @click="readAllNotifications">{{ $ts.markAsReadAllNotifications }}</FormLink>
		<FormLink class="_formBlock" @click="readAllUnreadNotes">{{ $ts.markAsReadAllUnreadNotes }}</FormLink>
		<FormLink class="_formBlock" @click="readAllMessagingMessages">{{ $ts.markAsReadAllTalkMessages }}</FormLink>
	</FormSection>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormButton from '@/components/ui/button.vue';
import FormLink from '@/components/form/link.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormSection from '@/components/form/section.vue';
import { notificationTypes } from 'misskey-js';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormLink,
		FormButton,
		FormSection,
	},

	emits: ['info'],
	
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.notifications,
				icon: 'fas fa-bell',
				bg: 'var(--bg)',
			},
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		readAllUnreadNotes() {
			os.api('i/read-all-unread-notes');
		},

		readAllMessagingMessages() {
			os.api('i/read-all-messaging-messages');
		},

		readAllNotifications() {
			os.api('notifications/mark-all-as-read');
		},

		configure() {
			const includingTypes = notificationTypes.filter(x => !this.$i.mutingNotificationTypes.includes(x));
			os.popup(import('@/components/notification-setting-window.vue'), {
				includingTypes,
				showGlobalToggle: false,
			}, {
				done: async (res) => {
					const { includingTypes: value } = res;
					await os.apiWithDialog('i/update', {
						mutingNotificationTypes: notificationTypes.filter(x => !value.includes(x)),
					}).then(i => {
						this.$i.mutingNotificationTypes = i.mutingNotificationTypes;
					});
				}
			}, 'closed');
		},
	}
});
</script>
