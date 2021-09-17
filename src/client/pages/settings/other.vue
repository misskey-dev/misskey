<template>
<FormBase>
	<FormLink to="/settings/update">Misskey Update</FormLink>

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

	<FormLink to="/settings/registry"><template #icon><i class="fas fa-cogs"></i></template>{{ $ts.registry }}</FormLink>

	<FormLink to="/bios" behavior="browser"><template #icon><i class="fas fa-door-open"></i></template>BIOS</FormLink>
	<FormLink to="/cli" behavior="browser"><template #icon><i class="fas fa-door-open"></i></template>CLI</FormLink>

	<FormLink to="/settings/delete-account"><template #icon><i class="fas fa-exclamation-triangle"></i></template>{{ $ts.closeAccount }}</FormLink>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import FormSwitch from '@client/components/form/switch.vue';
import FormSelect from '@client/components/form/select.vue';
import FormLink from '@client/components/form/link.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormButton from '@client/components/form/button.vue';
import * as os from '@client/os';
import { debug } from '@client/config';
import { defaultStore } from '@client/store';
import { unisonReload } from '@client/scripts/unison-reload';
import * as symbols from '@client/symbols';

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
			[symbols.PAGE_INFO]: {
				title: this.$ts.other,
				icon: 'fas fa-ellipsis-h'
			},
			debug,
		}
	},

	computed: {
		reportError: defaultStore.makeGetterSetter('reportError'),
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		changeDebug(v) {
			console.log(v);
			localStorage.setItem('debug', v.toString());
			unisonReload();
		},

		onChangeInjectFeaturedNote(v) {
			os.api('i/update', {
				injectFeaturedNote: v
			});
		},

		taskmanager() {
			os.popup(import('@client/components/taskmanager.vue'), {
			}, {}, 'closed');
		},
	}
});
</script>
