<template>
<FormBase>
	<FormGroup>
		<div class="_formItem _formPanel" :style="{ backgroundImage: file ? `url(${ file.thumbnailUrl })` : null }">
		</div>
		<FormButton @click="selectFile" primary>Select file</FormButton>
	</FormGroup>

	<FormInput v-model:value="title">
		<span>{{ $ts.title }}</span>
	</FormInput>

	<FormTextarea v-model:value="description" :max="500">
		<span>{{ $ts.description }}</span>
	</FormTextarea>

	<FormSwitch v-model:value="isSensitive">{{ $ts.isSensitive }}</FormSwitch>

	<FormButton @click="save(true)" primary><Fa :icon="faSave"/> {{ $ts.publish }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faUnlockAlt, faCogs, faUser, faMapMarkerAlt, faBirthdayCake } from '@fortawesome/free-solid-svg-icons';
import { faSave } from '@fortawesome/free-regular-svg-icons';
import FormButton from '@/components/form/button.vue';
import FormInput from '@/components/form/input.vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormTuple from '@/components/form/tuple.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import { selectFile } from '@/scripts/select-file';
import * as os from '@/os';

export default defineComponent({
	components: {
		FormButton,
		FormInput,
		FormTextarea,
		FormSwitch,
		FormBase,
		FormGroup,
	},
	
	emits: ['info'],

	data() {
		return {
			INFO: {
				title: this.$ts.profile,
				icon: faUser
			},
			file: null,
			description: null,
			title: null,
			isSensitive: false,
			faSave, faUnlockAlt, faCogs, faUser, faMapMarkerAlt, faBirthdayCake
		}
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {
		selectFile(e) {
			selectFile(e.currentTarget || e.target).then(file => {
				this.file = file;
			});
		},
	}
});
</script>

<style lang="scss" scoped>

</style>
