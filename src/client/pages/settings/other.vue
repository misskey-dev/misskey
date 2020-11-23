<template>
<FormBase>
	<FormSwitch :value="$store.state.i.injectFeaturedNote" @update:value="onChangeInjectFeaturedNote">
		{{ $t('showFeaturedNotesInTimeline') }}
	</FormSwitch>

	<FormGroup>
		<FormSwitch v-model:value="debug" @update:value="changeDebug">
			DEBUG MODE
		</FormSwitch>
		<template v-if="debug">
			<FormLink to="/settings/regedit">RegEdit</FormLink>
			<FormButton @click="taskmanager">Task Manager</FormButton>
		</template>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import { faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormLink from '@/components/form/link.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import FormButton from '@/components/form/button.vue';
import * as os from '@/os';
import { debug } from '@/config';

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
				title: this.$t('other'),
				icon: faEllipsisH
			},
			debug
		}
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
		}
	}
});
</script>
