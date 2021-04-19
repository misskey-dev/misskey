<template>
<FormBase>
	<FormInput v-model:value="title">
		<span>{{ $ts.title }}</span>
	</FormInput>

	<FormTextarea v-model:value="description" :max="500">
		<span>{{ $ts.description }}</span>
	</FormTextarea>

	<FormGroup>
		<div v-for="file in files" :key="file.id" class="_formItem _formPanel wqugxsfx" :style="{ backgroundImage: file ? `url(${ file.thumbnailUrl })` : null }">
		</div>
		<FormButton @click="selectFile" primary>{{ $ts.attachFile }}</FormButton>
	</FormGroup>

	<FormSwitch v-model:value="isSensitive">{{ $ts.markAsSensitive }}</FormSwitch>

	<FormButton @click="publish" primary><Fa :icon="faSave"/> {{ $ts.publish }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faUnlockAlt, faCogs, faUser, faMapMarkerAlt, faBirthdayCake } from '@fortawesome/free-solid-svg-icons';
import { faSave } from '@fortawesome/free-regular-svg-icons';
import FormButton from '@client/components/form/button.vue';
import FormInput from '@client/components/form/input.vue';
import FormTextarea from '@client/components/form/textarea.vue';
import FormSwitch from '@client/components/form/switch.vue';
import FormTuple from '@client/components/form/tuple.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import { selectFile } from '@client/scripts/select-file';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		FormButton,
		FormInput,
		FormTextarea,
		FormSwitch,
		FormBase,
		FormGroup,
	},
	
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.postToGallery,
				icon: faUser
			},
			files: [],
			description: null,
			title: null,
			isSensitive: false,
			faSave, faUnlockAlt, faCogs, faUser, faMapMarkerAlt, faBirthdayCake
		}
	},

	methods: {
		selectFile(e) {
			selectFile(e.currentTarget || e.target, null, true).then(files => {
				this.files = this.files.concat(files);
			});
		},

		publish() {
			os.apiWithDialog('gallery/create', {
				title: this.title,
				description: this.description,
				fileIds: this.files.map(file => file.id),
				isSensitive: this.isSensitive,
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.wqugxsfx {
	height: 200px;
	background-size: contain;
	background-position: center;
	background-repeat: no-repeat;
}
</style>
