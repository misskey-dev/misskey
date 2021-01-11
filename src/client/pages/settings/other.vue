<template>
<FormBase>
	<FormSwitch :value="$i.injectFeaturedNote" @update:value="onChangeInjectFeaturedNote">
		{{ $ts.showFeaturedNotesInTimeline }}
	</FormSwitch>

	<FormSwitch v-model:value="reportError">{{ $ts.sendErrorReports }}<template #desc>{{ $ts.sendErrorReportsDescription }}</template></FormSwitch>

	<FormLink to="/settings/account-info">{{ $ts.accountInfo }}</FormLink>
	<FormLink to="/settings/experimental-features">{{ $ts.experimentalFeatures }}</FormLink>

	<FormGroup>
		<template #label>{{ $ts.developer }}</template>
		<FormSwitch v-model:value="debug" @update:value="changeDebug">
			DEBUG MODE
		</FormSwitch>
		<template v-if="debug">
			<FormButton @click="taskmanager">Task Manager</FormButton>
		</template>
	</FormGroup>

	<FormLink to="/settings/registry"><template #icon><Fa :icon="faCogs"/></template>{{ $ts.registry }}</FormLink>

	<FormButton @click="closeAccount" danger>{{ $ts.closeAccount }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import { faEllipsisH, faCogs } from '@fortawesome/free-solid-svg-icons';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormLink from '@/components/form/link.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import FormButton from '@/components/form/button.vue';
import * as os from '@/os';
import { debug } from '@/config';
import { defaultStore } from '@/store';
import { signout } from '@/account';

export default defineComponent({
	components: {
		FormBase,
		FormSelect,
		FormSwitch,
		FormButton,
		FormLink,
		FormGroup,
	},

	emits: ['info'],
	
	data() {
		return {
			INFO: {
				title: this.$ts.other,
				icon: faEllipsisH
			},
			debug,
			faCogs
		}
	},

	computed: {
		reportError: defaultStore.makeGetterSetter('reportError'),
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {
		changeDebug(v) {
			console.log(v);
			localStorage.setItem('debug', v.toString());
			location.reload();
		},

		onChangeInjectFeaturedNote(v) {
			os.api('i/update', {
				injectFeaturedNote: v
			});
		},

		taskmanager() {
			os.popup(import('@/components/taskmanager.vue'), {
			}, {}, 'closed');
		},

		closeAccount() {
			os.dialog({
				title: this.$ts.password,
				input: {
					type: 'password'
				}
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				os.api('i/delete-account', {
					password: password
				}).then(() => {
					signout();
				});
			});
		}
	}
});
</script>
