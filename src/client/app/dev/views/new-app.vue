<template>
<mk-ui>
	<b-card :header="$t('new-app')">
		<b-alert show variant="info"><fa icon="info-circle"/> {{ $t('new-app-info') }}</b-alert>
		<b-form @submit.prevent="onSubmit" autocomplete="off">
			<b-form-group :label="$t('app-name')" :description="$t('app-name-desc')">
				<b-form-input v-model="name" type="text" :placeholder="$t('app-name-placeholder')" autocomplete="off" required/>
			</b-form-group>
			<b-form-group :label="$t('app-overview')" :description="$t('app-overview-desc')">
				<b-textarea v-model="description" :placeholder="$t('app-overview-placeholder')" autocomplete="off" required></b-textarea>
			</b-form-group>
			<b-form-group :label="$t('callback-url')" :description="$t('callback-url-desc')">
				<b-input v-model="cb" type="url" :placeholder="$t('callback-url-placeholder')" autocomplete="off"/>
			</b-form-group>
			<b-card :header="$t('authority')">
				<b-form-group :description="$t('authority-desc')">
					<b-alert show variant="warning"><fa icon="exclamation-triangle"/> {{ $t('authority-warning') }}</b-alert>
					<b-form-checkbox-group v-model="permission" stacked>
						<b-form-checkbox v-for="v in permissionsList" :value="v" :key="v">{{ $t(`@.permissions.${v}`) }} ({{ v }})</b-form-checkbox>
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
			permission: [],
			permissionsList: []
		};
	},
	created() {
		this.$root.api('permissions').then(permissions => {
			this.permissionsList = permissions
		});
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
