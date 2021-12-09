<template>
<div class="_formRoot">
	<MkInfo>{{ $ts._instanceMute.title }}</MkInfo>
	<FormTextarea v-model="instanceMutes" class="_formBlock">
		<template #label>{{ $ts._instanceMute.heading }}</template>
		<template #caption>{{ $ts._instanceMute.instanceMuteDescription }}<br>{{ $ts._instanceMute.instanceMuteDescription2 }}</template>
	</FormTextarea>
	<MkButton primary :disabled="!changed" class="_formBlock" @click="save()"><i class="fas fa-save"></i> {{ $ts.save }}</MkButton>
</div>
</template>

<script>
import { defineComponent } from 'vue';
import FormTextarea from '@/components/form/textarea.vue';
import MkInfo from '@/components/ui/info.vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		MkButton,
		FormTextarea,
		MkInfo,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.instanceMute,
				icon: 'fas fa-volume-mute'
			},
			tab: 'soft',
			instanceMutes: '',
			changed: false,
		}
	},

	watch: {
		instanceMutes: {
			handler() {
				this.changed = true;
			},
			deep: true
		},
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},


	async created() {
		this.instanceMutes = this.$i.mutedInstances.join('\n');
	},

	methods: {
		async save() {
			let mutes = this.instanceMutes.trim().split('\n').map(el => el.trim()).filter(el => el);
			await os.api('i/update', {
				mutedInstances: mutes,
			});
			this.changed = false;

			// Refresh filtered list to signal to the user how they've been saved
			this.instanceMutes = mutes.join('\n');
		},
	}
})
</script>
