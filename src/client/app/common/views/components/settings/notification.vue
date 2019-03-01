<template>
<ui-card>
	<template #title><fa :icon="['far', 'bell']"/> {{ $t('title') }}</template>
	<section>
		<ui-switch v-model="$store.state.i.settings.autoWatch" @change="onChangeAutoWatch">
			{{ $t('auto-watch') }}<template #desc>{{ $t('auto-watch-desc') }}</template>
		</ui-switch>
		<section>
			<ui-button @click="readAllNotifications">{{ $t('mark-as-read-all-notifications') }}</ui-button>
			<ui-button @click="readAllUnreadNotes">{{ $t('mark-as-read-all-unread-notes') }}</ui-button>
			<ui-button @click="readAllMessagingMessages">{{ $t('mark-as-read-all-talk-messages') }}</ui-button>
		</section>
	</section>
</ui-card>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';

export default Vue.extend({
	i18n: i18n('common/views/components/notification-settings.vue'),

	methods: {
		onChangeAutoWatch(v) {
			this.$root.api('i/update', {
				autoWatch: v
			});
		},

		readAllUnreadNotes() {
			this.$root.api('i/read_all_unread_notes');
		},

		readAllMessagingMessages() {
			this.$root.api('i/read_all_messaging_messages');
		},

		readAllNotifications() {
			this.$root.api('notifications/mark_all_as_read');
		}
	}
});
</script>
