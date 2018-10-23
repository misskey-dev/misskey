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
					<b-alert show variant="warning">%fa:exclamation-triangle% %i18n:@authority-warning%</b-alert>
					<b-form-checkbox-group v-model="permission" stacked>
						<b-form-checkbox value="account-read">%i18n:@account-read%</b-form-checkbox>
						<b-form-checkbox value="account-write">%i18n:@account-write%</b-form-checkbox>
						<b-form-checkbox value="note-write">%i18n:@note-write%</b-form-checkbox>
						<b-form-checkbox value="reaction-write">%i18n:@reaction-write%</b-form-checkbox>
						<b-form-checkbox value="following-write">%i18n:@following-write%</b-form-checkbox>
						<b-form-checkbox value="drive-read">%i18n:@drive-read%</b-form-checkbox>
						<b-form-checkbox value="drive-write">%i18n:@drive-write%</b-form-checkbox>
						<b-form-checkbox value="notification-read">%i18n:@notification-read%</b-form-checkbox>
						<b-form-checkbox value="notification-write">%i18n:@notification-write%</b-form-checkbox>
					</b-form-checkbox-group>
				</b-form-group>
			</b-card>
			<hr>
			<b-button type="submit" variant="primary">%i18n:@create-app%</b-button>
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
