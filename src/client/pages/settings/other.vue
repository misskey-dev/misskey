<template>
<div>
	<div class="_section">
		<div class="_card">
			<div class="_content">
				<MkSwitch v-model:value="$store.state.i.injectFeaturedNote" @update:value="onChangeInjectFeaturedNote">
					{{ $t('showFeaturedNotesInTimeline') }}
				</MkSwitch>
			</div>
		</div>
	</div>
	<div class="_section">
		<MkSwitch v-model:value="debug" @update:value="changeDebug">
			DEBUG MODE
		</MkSwitch>
		<div v-if="debug">
			<MkA to="/settings/regedit">RegEdit</MkA>
			<MkButton @click="taskmanager">Task Manager</MkButton>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import { faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import MkSelect from '@/components/ui/select.vue';
import MkSwitch from '@/components/ui/switch.vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import { debug } from '@/config';

export default defineComponent({
	components: {
		MkSelect,
		MkSwitch,
		MkButton,
	},

	emits: ['info'],
	
	data() {
		return {
			INFO: {
				header: [{
					title: this.$t('other'),
					icon: faEllipsisH
				}]
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
			os.popup(defineAsyncComponent(() => import('@/components/taskmanager.vue')), {
			}, {}, 'closed');
		}
	}
});
</script>
