<template>
<div class="ztgjmzrw">
	<portal to="icon"><fa :icon="faBroadcastTower"/></portal>
	<portal to="title">{{ $t('announcements') }}</portal>
	<x-button @click="add()" primary style="margin: 0 auto 16px auto;"><fa :icon="faPlus"/> {{ $t('add') }}</x-button>
	<section class="_section announcements">
		<div class="_content announcement" v-for="announcement in announcements">
			<x-input v-model="announcement.title" style="margin-top: 0;">
				<span>{{ $t('title') }}</span>
			</x-input>
			<x-textarea v-model="announcement.text">
				<span>{{ $t('text') }}</span>
			</x-textarea>
			<x-input v-model="announcement.imageUrl">
				<span>{{ $t('imageUrl') }}</span>
			</x-input>
			<p v-if="announcement.reads">{{ $t('nUsersRead', { n: announcement.reads }) }}</p>
			<div class="buttons">
				<x-button class="button" inline @click="save(announcement)" primary><fa :icon="faSave"/> {{ $t('save') }}</x-button>
				<x-button class="button" inline @click="remove(announcement)"><fa :icon="faTrashAlt"/> {{ $t('remove') }}</x-button>
			</div>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faBroadcastTower, faPlus } from '@fortawesome/free-solid-svg-icons';
import { faSave, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import i18n from '../../i18n';
import XButton from '../../components/ui/button.vue';
import XInput from '../../components/ui/input.vue';
import XTextarea from '../../components/ui/textarea.vue';

export default Vue.extend({
	i18n,

	metaInfo() {
		return {
			title: this.$t('announcements') as string
		};
	},

	components: {
		XButton,
		XInput,
		XTextarea,
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
