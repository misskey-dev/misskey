<template>
<FormBase>
	<X2fa/>
	<FormLink to="/settings/2fa"><template #icon><i class="fas fa-mobile-alt"></i></template>{{ $ts.twoStepAuthentication }}</FormLink>
	<FormButton primary @click="change()">{{ $ts.changePassword }}</FormButton>
	<FormPagination :pagination="pagination">
		<template #label>{{ $ts.signinHistory }}</template>
		<template #default="{items}">
			<div class="_debobigegoPanel timnmucd" v-for="item in items" :key="item.id">
				<header>
					<i v-if="item.success" class="fas fa-check icon succ"></i>
					<i v-else class="fas fa-times-circle icon fail"></i>
					<code class="ip _monospace">{{ item.ip }}</code>
					<MkTime :time="item.createdAt" class="time"/>
				</header>
			</div>
		</template>
	</FormPagination>
	<FormGroup>
		<FormButton danger @click="regenerateToken"><i class="fas fa-sync-alt"></i> {{ $ts.regenerateLoginToken }}</FormButton>
		<template #caption>{{ $ts.regenerateLoginTokenDescription }}</template>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormBase from '@/components/debobigego/base.vue';
import FormLink from '@/components/debobigego/link.vue';
import FormGroup from '@/components/debobigego/group.vue';
import FormButton from '@/components/debobigego/button.vue';
import FormPagination from '@/components/debobigego/pagination.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

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
			[symbols.PAGE_INFO]: {
				title: this.$ts.security,
				icon: 'fas fa-lock',
				bg: 'var(--bg)',
			},
			pagination: {
				endpoint: 'i/signin-history',
				limit: 5,
			},
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
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
