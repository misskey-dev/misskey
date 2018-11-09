<template>
<mk-ui>
	<b-card :header="$t('header')">
		<b-form @submit.prevent="onSubmit" autocomplete="off">
			<b-form-group :label="$t('app-name')" :description="$t('description')">
				<b-form-input v-model="name" type="text" :placeholder="$t('placeholder')" autocomplete="off" required/>
			</b-form-group>
			<b-form-group :label="$t('app-overview')" :description="$t('description')">
				<b-textarea v-model="description" :placeholder="$t('placeholder')" autocomplete="off" required></b-textarea>
			</b-form-group>
			<b-form-group :label="$t('callback-url')" :description="$t('description')">
				<b-input v-model="cb" type="url" placeholder="ex) https://your.app.example.com/callback.php" autocomplete="off"/>
			</b-form-group>
			<b-card :header="$t('header')">
				<b-form-group :description="$t('description')">
					<b-alert show variant="warning"><fa icon="exclamation-triangle"/> {{ $t('authority-warning') }}</b-alert>
					<b-form-checkbox-group v-model="permission" stacked>
						<b-form-checkbox value="account-read">{{ $t('account-read') }}</b-form-checkbox>
						<b-form-checkbox value="account-write">{{ $t('account-write') }}</b-form-checkbox>
						<b-form-checkbox value="note-write">{{ $t('note-write') }}</b-form-checkbox>
						<b-form-checkbox value="reaction-write">{{ $t('reaction-write') }}</b-form-checkbox>
						<b-form-checkbox value="following-write">{{ $t('following-write') }}</b-form-checkbox>
						<b-form-checkbox value="drive-read">{{ $t('drive-read') }}</b-form-checkbox>
						<b-form-checkbox value="drive-write">{{ $t('drive-write') }}</b-form-checkbox>
						<b-form-checkbox value="notification-read">{{ $t('notification-read') }}</b-form-checkbox>
						<b-form-checkbox value="notification-write">{{ $t('notification-write') }}</b-form-checkbox>
					</b-form-checkbox-group>
				</b-form-group>
			</b-card>
			<hr>
			<b-button type="submit" variant="primary">{{ $t('create-app') }}</b-button>
		</b-form>
	</b-card>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
export default Vue.extend({
	i18n: i18n('dev/views/new-app.vue'),
	data() {
		return {
			name: '',
			description: '',
			cb: '',
			nidState: null,
			permission: []
		};
	},
	methods: {
		onSubmit() {
			this.$root.api('app/create', {
				name: this.name,
				description: this.description,
				callbackUrl: this.cb,
				permission: this.permission
			}).then(() => {
				location.href = '/dev/apps';
			}).catch(() => {
				alert(this.$t('@.dev.failed-to-create'));
			});
		}
	}
});
</script>
