<template>
<mk-ui>
	<b-card header="%i18n:@create-app%">
		<b-form @submit.prevent="onSubmit" autocomplete="off">
			<b-form-group label="%i18n:@app-name%" description="%i18n:@app-name-desc%">
				<b-form-input v-model="name" type="text" placeholder="%i18n:@app-name-ex%" autocomplete="off" required/>
			</b-form-group>
			<b-form-group label="%i18n:@app-overview%" description="%i18n:@app-desc%">
				<b-textarea v-model="description" placeholder="%i18n:@app-desc-ex%" autocomplete="off" required></b-textarea>
			</b-form-group>
			<b-form-group label="%i18n:@callback-url%" description="%i18n:@callback-url-desc%">
				<b-input v-model="cb" type="url" placeholder="ex) https://your.app.example.com/callback.php" autocomplete="off"/>
			</b-form-group>
			<b-card header="%i18n:@authority%">
				<b-form-group description="%i18n:@authority-desc%">
					<b-alert show variant="warning"><fa icon="exclamation-triangle"/> %i18n:@authority-warning%</b-alert>
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
export default Vue.extend({
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
			(this as any).api('app/create', {
				name: this.name,
				description: this.description,
				callbackUrl: this.cb,
				permission: this.permission
			}).then(() => {
				location.href = '/dev/apps';
			}).catch(() => {
				alert('%i18n:common.dev.failed-to-create%');
			});
		}
	}
});
</script>
