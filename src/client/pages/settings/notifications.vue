<template>
<div>
	<div class="_section">
		<MkButton style="width: 100%;" primary @click="configure"><Fa :icon="faCog"/> {{ $t('notificationSetting') }}</MkButton>
	</div>
	<div class="_section">
		<div class="_card">
			<div class="_content">
				<MkSwitch v-model:value="$store.state.i.autoWatch" @update:value="onChangeAutoWatch">
					{{ $t('autoNoteWatch') }}<template #desc>{{ $t('autoNoteWatchDescription') }}</template>
				</MkSwitch>
			</div>
		</div>
	</div>
	<div class="_section">
		<MkButton style="width: 100%;" @click="readAllNotifications">{{ $t('markAsReadAllNotifications') }}</MkButton>
		<MkButton style="width: 100%;" @click="readAllUnreadNotes">{{ $t('markAsReadAllUnreadNotes') }}</MkButton>
		<MkButton style="width: 100%;" @click="readAllMessagingMessages">{{ $t('markAsReadAllTalkMessages') }}</MkButton>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkSwitch from '@/components/ui/switch.vue';
import { notificationTypes } from '../../../types';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton,
		MkSwitch,
	},

	emits: ['info'],
	
	data() {
		return {
			INFO: {
				header: [{
					title: this.$t('notifications'),
					icon: faBell
				}]
			},
			faCog
		}
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {
		onChangeAutoWatch(v) {
			os.api('i/update', {
				autoWatch: v
			});
		},

		readAllUnreadNotes() {
			os.api('i/read-all-unread-notes');
		},

		readAllMessagingMessages() {
			os.api('i/read-all-messaging-messages');
		},

		readAllNotifications() {
			os.api('notifications/mark-all-as-read');
		},

		async configure() {
			const includingTypes = notificationTypes.filter(x => !this.$store.state.i.mutingNotificationTypes.includes(x));
			os.modal(await import('@/components/notification-setting-window.vue'), {
				includingTypes,
				showGlobalToggle: false,
			}).then(async (res) => {
				if (res == null) return;
				const { includingTypes: value } = res;
				await os.api('i/update', {
					mutingNotificationTypes: notificationTypes.filter(x => !value.includes(x)),
				}).then(i => {
					this.$store.state.i.mutingNotificationTypes = i.mutingNotificationTypes;
				}).catch(err => {
					os.dialog({
						type: 'error',
						text: err.message
					});
				});
			});
		},
	}
});
</script>
