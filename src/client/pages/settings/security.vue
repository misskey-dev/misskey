<template>
<FormBase>
	<X2fa/>
	<FormLink to="/settings/2fa"><template #icon><Fa :icon="faMobileAlt"/></template>{{ $ts.twoStepAuthentication }}</FormLink>
	<FormButton primary @click="change()">{{ $ts.changePassword }}</FormButton>
	<FormPagination :pagination="pagination">
		<template #label>{{ $ts.signinHistory }}</template>
		<template #default="{items}">
			<div class="_formPanel timnmucd" v-for="item in items" :key="item.id">
				<header>
					<Fa class="icon succ" :icon="faCheck" v-if="item.success"/>
					<Fa class="icon fail" :icon="faTimesCircle" v-else/>
					<code class="ip _monospace">{{ item.ip }}</code>
					<MkTime :time="item.createdAt" class="time"/>
				</header>
			</div>
		</template>
	</FormPagination>
	<FormGroup>
		<FormButton danger @click="regenerateToken"><Fa :icon="faSyncAlt"/> {{ $ts.regenerateLoginToken }}</FormButton>
		<template #caption>{{ $ts.regenerateLoginTokenDescription }}</template>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCheck, faTimesCircle, faLock, faSyncAlt, faMobileAlt } from '@fortawesome/free-solid-svg-icons';
import FormBase from '@client/components/form/base.vue';
import FormLink from '@client/components/form/link.vue';
import FormGroup from '@client/components/form/group.vue';
import FormButton from '@client/components/form/button.vue';
import FormPagination from '@client/components/form/pagination.vue';
import * as os from '@client/os';

export default defineComponent({
	components: {
		FormBase,
		FormLink,
		FormButton,
		FormPagination,
		FormGroup,
	},
	
	emits: ['info'],
	
	data() {
		return {
			INFO: {
				title: this.$ts.security,
				icon: faLock
			},
			pagination: {
				endpoint: 'i/signin-history',
				limit: 5,
			},
			faLock, faSyncAlt, faCheck, faTimesCircle, faMobileAlt,
		}
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {
		async change() {
			const { canceled: canceled1, result: currentPassword } = await os.dialog({
				title: this.$ts.currentPassword,
				input: {
					type: 'password'
				}
			});
			if (canceled1) return;

			const { canceled: canceled2, result: newPassword } = await os.dialog({
				title: this.$ts.newPassword,
				input: {
					type: 'password'
				}
			});
			if (canceled2) return;

			const { canceled: canceled3, result: newPassword2 } = await os.dialog({
				title: this.$ts.newPasswordRetype,
				input: {
					type: 'password'
				}
			});
			if (canceled3) return;

			if (newPassword !== newPassword2) {
				os.dialog({
					type: 'error',
					text: this.$ts.retypedNotMatch
				});
				return;
			}
			
			os.apiWithDialog('i/change-password', {
				currentPassword,
				newPassword
			});
		},

		regenerateToken() {
			os.dialog({
				title: this.$ts.password,
				input: {
					type: 'password'
				}
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				os.api('i/regenerate_token', {
					password: password
				});
			});
		},
	}
});
</script>

<style lang="scss" scoped>
.timnmucd {
	padding: 16px;

	> header {
		display: flex;
		align-items: center;

		> .icon {
			width: 1em;
			margin-right: 0.75em;

			&.succ {
				color: var(--success);
			}

			&.fail {
				color: var(--error);
			}
		}

		> .ip {
			flex: 1;
			min-width: 0;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			margin-right: 12px;
		}

		> .time {
			margin-left: auto;
			opacity: 0.7;
		}
	}
}
</style>
