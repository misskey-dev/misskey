<template>
<div class="ztgjmzrw">
	<portal to="header"><fa :icon="faBroadcastTower"/>{{ $t('announcements') }}</portal>
	<mk-button @click="add()" primary style="margin: 0 auto 16px auto;"><fa :icon="faPlus"/> {{ $t('add') }}</mk-button>
	<section class="_card announcements">
		<div class="_content announcement" v-for="announcement in announcements">
			<mk-input v-model="announcement.title">
				<span>{{ $t('title') }}</span>
			</mk-input>
			<mk-textarea v-model="announcement.text">
				<span>{{ $t('text') }}</span>
			</mk-textarea>
			<mk-input v-model="announcement.imageUrl">
				<span>{{ $t('imageUrl') }}</span>
			</mk-input>
			<p v-if="announcement.reads">{{ $t('nUsersRead', { n: announcement.reads }) }}</p>
			<div class="buttons">
				<mk-button class="button" inline @click="save(announcement)" primary><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
				<mk-button class="button" inline @click="remove(announcement)"><fa :icon="faTrashAlt"/> {{ $t('remove') }}</mk-button>
			</div>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faBroadcastTower, faPlus } from '@fortawesome/free-solid-svg-icons';
import { faSave, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import MkButton from '../../components/ui/button.vue';
import MkInput from '../../components/ui/input.vue';
import MkTextarea from '../../components/ui/textarea.vue';

export default defineComponent({
	metaInfo() {
		return {
			title: this.$t('announcements') as string
		};
	},

	components: {
		MkButton,
		MkInput,
		MkTextarea,
	},

	data() {
		return {
			announcements: [],
			faBroadcastTower, faSave, faTrashAlt, faPlus
		}
	},

	created() {
		this.$root.api('admin/announcements/list').then(announcements => {
			this.announcements = announcements;
		});
	},

	methods: {
		add() {
			this.announcements.unshift({
				id: null,
				title: '',
				text: '',
				imageUrl: null
			});
		},

		remove(announcement) {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('removeAreYouSure', { x: announcement.title }),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;
				this.announcements = this.announcements.filter(x => x != announcement);
				this.$root.api('admin/announcements/delete', announcement);
			});
		},

		save(announcement) {
			if (announcement.id == null) {
				this.$root.api('admin/announcements/create', announcement).then(() => {
					this.$root.dialog({
						type: 'success',
						text: this.$t('saved')
					});
				}).catch(e => {
					this.$root.dialog({
						type: 'error',
						text: e
					});
				});
			} else {
				this.$root.api('admin/announcements/update', announcement).then(() => {
					this.$root.dialog({
						type: 'success',
						text: this.$t('saved')
					});
				}).catch(e => {
					this.$root.dialog({
						type: 'error',
						text: e
					});
				});
			}
		}
	}
});
</script>

<style lang="scss" scoped>
.ztgjmzrw {
	> .announcements {
		> .announcement {
			> .buttons {
				> .button:first-child {
					margin-right: 8px;
				}
			}
		}
	}
}
</style>
