<template>
<div v-if="clip" class="_section">
	<div class="okzinsic _content _panel _vMargin">
		<div class="description" v-if="clip.description">
			<Mfm :text="clip.description" :is-note="false" :i="$i"/>
		</div>
		<div class="user">
			<MkAvatar :user="clip.user" class="avatar"/> <MkUserName :user="clip.user" :nowrap="false"/>
		</div>
	</div>

	<XNotes class="_content _vMargin" :pagination="pagination" :detail="true"/>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { faEllipsisH, faPaperclip, faPencilAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import MkContainer from '@/components/ui/container.vue';
import XPostForm from '@/components/post-form.vue';
import XNotes from '@/components/notes.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkContainer,
		XPostForm,
		XNotes,
	},

	props: {
		clipId: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			INFO: computed(() => this.clip ? {
				title: this.clip.name,
				icon: faPaperclip,
				action: {
					icon: faEllipsisH,
					handler: this.menu
				}
			} : null),
			clip: null,
			pagination: {
				endpoint: 'clips/notes',
				limit: 10,
				params: () => ({
					clipId: this.clipId,
				})
			},
		};
	},

	computed: {
		isOwned(): boolean {
			return this.$i && this.clip && (this.$i.id === this.clip.userId);
		}
	},

	watch: {
		clipId: {
			async handler() {
				this.clip = await os.api('clips/show', {
					clipId: this.clipId,
				});
			},
			immediate: true
		}
	},

	created() {

	},

	methods: {
		menu(ev) {
			os.modalMenu([this.isOwned ? {
				icon: faPencilAlt,
				text: this.$ts.edit,
				action: async () => {
					const { canceled, result } = await os.form(this.clip.name, {
						name: {
							type: 'string',
							label: this.$ts.name,
							default: this.clip.name
						},
						description: {
							type: 'string',
							required: false,
							multiline: true,
							label: this.$ts.description,
							default: this.clip.description
						},
						isPublic: {
							type: 'boolean',
							label: this.$ts.public,
							default: this.clip.isPublic
						}
					});
					if (canceled) return;

					os.apiWithDialog('clips/update', {
						clipId: this.clip.id,
						...result
					});
				}
			} : undefined, this.isOwned ? {
				icon: faTrashAlt,
				text: this.$ts.delete,
				danger: true,
				action: async () => {
					const { canceled } = await os.dialog({
						type: 'warning',
						text: this.$t('deleteAreYouSure', { x: this.clip.name }),
						showCancelButton: true
					});
					if (canceled) return;

					await os.apiWithDialog('clips/delete', {
						clipId: this.clip.id,
					});
				}
			} : undefined], ev.currentTarget || ev.target);
		}
	}
});
</script>

<style lang="scss" scoped>
.okzinsic {
	position: relative;

	> .description {
		padding: 16px;
	}

	> .user {
		$height: 32px;
		padding: 16px;
		border-top: solid 1px var(--divider);
		line-height: $height;

		> .avatar {
			width: $height;
			height: $height;
		}
	}
}
</style>
