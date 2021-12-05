<template>
<div class="_formRoot">
	<FormSection>
		<template #label>{{ $ts.password }}</template>
		<FormButton primary @click="change()">{{ $ts.changePassword }}</FormButton>
	</FormSection>

	<FormSection>
		<template #label>{{ $ts.twoStepAuthentication }}</template>
		<X2fa/>
	</FormSection>
	
	<FormSection>
		<template #label>{{ $ts.signinHistory }}</template>
		<FormPagination :pagination="pagination">
			<template v-slot="{items}">
				<div>
					<div v-for="item in items" :key="item.id" v-panel class="timnmucd">
						<header>
							<i v-if="item.success" class="fas fa-check icon succ"></i>
							<i v-else class="fas fa-times-circle icon fail"></i>
							<code class="ip _monospace">{{ item.ip }}</code>
							<MkTime :time="item.createdAt" class="time"/>
						</header>
					</div>
				</div>
			</template>
		</FormPagination>
	</FormSection>

	<FormSection>
		<FormSlot>
			<FormButton danger @click="regenerateToken"><i class="fas fa-sync-alt"></i> {{ $ts.regenerateLoginToken }}</FormButton>
			<template #caption>{{ $ts.regenerateLoginTokenDescription }}</template>
		</FormSlot>
	</FormSection>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSection from '@/components/form/section.vue';
import FormLink from '@/components/debobigego/link.vue';
import FormSlot from '@/components/form/slot.vue';
import FormButton from '@/components/ui/button.vue';
import FormPagination from '@/components/form/pagination.vue';
import X2fa from './2fa.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormSection,
		FormLink,
		FormButton,
		FormPagination,
		FormSlot,
		X2fa,
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
			const { canceled: canceled1, result: currentPassword } = await os.inputText({
				title: this.$ts.currentPassword,
				type: 'password'
			});
			if (canceled1) return;

			const { canceled: canceled2, result: newPassword } = await os.inputText({
				title: this.$ts.newPassword,
				type: 'password'
			});
			if (canceled2) return;

			const { canceled: canceled3, result: newPassword2 } = await os.inputText({
				title: this.$ts.newPasswordRetype,
				type: 'password'
			});
			if (canceled3) return;

			if (newPassword !== newPassword2) {
				os.alert({
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
			os.inputText({
				title: this.$ts.password,
				type: 'password'
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

	&:first-child {
		border-top-left-radius: 6px;
		border-top-right-radius: 6px;
	}

	&:last-child {
		border-bottom-left-radius: 6px;
		border-bottom-right-radius: 6px;
	}

	&:not(:last-child) {
		border-bottom: solid 0.5px var(--divider);
	}

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
