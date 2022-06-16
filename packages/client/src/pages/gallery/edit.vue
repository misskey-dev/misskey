<template>
<div>
	<FormSuspense :p="init">
		<FormInput v-model="title">
			<template #label>{{ $ts.title }}</template>
		</FormInput>

		<FormTextarea v-model="description" :max="500">
			<template #label>{{ $ts.description }}</template>
		</FormTextarea>

		<FormGroup>
			<div v-for="file in files" :key="file.id" class="_formGroup wqugxsfx" :style="{ backgroundImage: file ? `url(${ file.thumbnailUrl })` : null }">
				<div class="name">{{ file.name }}</div>
				<button v-tooltip="$ts.remove" class="remove _button" @click="remove(file)"><i class="fas fa-times"></i></button>
			</div>
			<FormButton primary @click="selectFile"><i class="fas fa-plus"></i> {{ $ts.attachFile }}</FormButton>
		</FormGroup>

		<FormSwitch v-model="isSensitive">{{ $ts.markAsSensitive }}</FormSwitch>

		<FormButton v-if="postId" primary @click="save"><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
		<FormButton v-else primary @click="save"><i class="fas fa-save"></i> {{ $ts.publish }}</FormButton>

		<FormButton v-if="postId" danger @click="del"><i class="fas fa-trash-alt"></i> {{ $ts.delete }}</FormButton>
	</FormSuspense>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import FormButton from '@/components/ui/button.vue';
import FormInput from '@/components/form/input.vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormGroup from '@/components/form/group.vue';
import FormSuspense from '@/components/form/suspense.vue';
import { selectFiles } from '@/scripts/select-file';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormButton,
		FormInput,
		FormTextarea,
		FormSwitch,
		FormGroup,
		FormSuspense,
	},

	props: {
		postId: {
			type: String,
			required: false,
			default: null,
		}
	},
	
	data() {
		return {
			[symbols.PAGE_INFO]: computed(() => this.postId ? {
				title: this.$ts.edit,
				icon: 'fas fa-pencil-alt'
			} : {
				title: this.$ts.postToGallery,
				icon: 'fas fa-pencil-alt'
			}),
			init: null,
			files: [],
			description: null,
			title: null,
			isSensitive: false,
		};
	},

	watch: {
		postId: {
			handler() {
				this.init = () => this.postId ? os.api('gallery/posts/show', {
					postId: this.postId
				}).then(post => {
					this.files = post.files;
					this.title = post.title;
					this.description = post.description;
					this.isSensitive = post.isSensitive;
				}) : Promise.resolve(null);
			},
			immediate: true,
		}
	},

	methods: {
		selectFile(evt) {
			selectFiles(evt.currentTarget ?? evt.target, null).then(files => {
				this.files = this.files.concat(files);
			});
		},

		remove(file) {
			this.files = this.files.filter(f => f.id !== file.id);
		},

		async save() {
			if (this.postId) {
				await os.apiWithDialog('gallery/posts/update', {
					postId: this.postId,
					title: this.title,
					description: this.description,
					fileIds: this.files.map(file => file.id),
					isSensitive: this.isSensitive,
				});
				this.$router.push(`/gallery/${this.postId}`);
			} else {
				const post = await os.apiWithDialog('gallery/posts/create', {
					title: this.title,
					description: this.description,
					fileIds: this.files.map(file => file.id),
					isSensitive: this.isSensitive,
				});
				this.$router.push(`/gallery/${post.id}`);
			}
		},

		async del() {
			const { canceled } = await os.confirm({
				type: 'warning',
				text: this.$ts.deleteConfirm,
			});
			if (canceled) return;
			await os.apiWithDialog('gallery/posts/delete', {
				postId: this.postId,
			});
			this.$router.push(`/gallery`);
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
	position: relative;

	> .name {
		position: absolute;
		top: 8px;
		left: 9px;
		padding: 8px;
		background: var(--panel);
	}

	> .remove {
		position: absolute;
		top: 8px;
		right: 9px;
		padding: 8px;
		background: var(--panel);
	}
}
</style>
