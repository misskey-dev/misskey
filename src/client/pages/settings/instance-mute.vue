<template>
	<div>
		<FormBase>
			<div class="_formItem">
				<FormInfo>{{ $ts._instanceMute.title}}</FormInfo>
				<FormTextarea v-model="instanceMutes">
					<span>{{$ts._instanceMute.heading}}</span>
					<template #desc>{{ $ts._instanceMute.instanceMuteDescription}}<br>{{$ts._instanceMute.instanceMuteDescription2}}</template>
				</FormTextarea>
			</div>
		<FormButton @click="save()" primary inline :disabled="!changed"><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
		</FormBase>
	</div>
</template>

<script>
import { defineComponent } from 'vue'
import FormBase from '@client/components/debobigego/base.vue';
import FormTextarea from '@client/components/debobigego/textarea.vue';
import FormInfo from '@client/components/debobigego/info.vue';
import FormKeyValueView from '@client/components/debobigego/key-value-view.vue';
import FormButton from '@client/components/debobigego/button.vue';
import * as os from '@client/os';
import number from '@client/filters/number';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormButton,
		FormTextarea,
		FormKeyValueView,
		FormInfo,
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

		number //?
	}
})
</script>
