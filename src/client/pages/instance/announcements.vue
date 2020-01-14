<template>
<div class="ztgjmzrw">
	<portal to="icon"><fa :icon="faBroadcastTower"/></portal>
	<portal to="title">{{ $t('announcements') }}</portal>
	<section class="_section announcements">
		<div class="_content announcement" v-for="(announcement, i) in announcements">
			<x-input v-model="announcement.title" style="margin-top: 0;">
				<span>{{ $t('title') }}</span>
			</x-input>
			<x-textarea v-model="announcement.text">
				<span>{{ $t('text') }}</span>
			</x-textarea>
			<x-input v-model="announcement.image">
				<span>{{ $t('imageUrl') }}</span>
			</x-input>
			<div class="buttons">
				<x-button class="button" inline @click="save()"><fa :icon="faSave"/> {{ $t('save') }}</x-button>
				<x-button class="button" inline @click="remove(i)"><fa :icon="faTrashAlt"/> {{ $t('remove') }}</x-button>
			</div>
		</div>
		<div class="_footer">
			<x-button @click="add()"><fa :icon="faPlus"/> {{ $t('add') }}</x-button>
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
		this.$root.getMeta().then(meta => {
			this.announcements = meta.announcements;
		});
	},

	methods: {
		add() {
			this.announcements.unshift({
				title: '',
				text: '',
				image: null
			});
		},

		remove(i) {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('removeAreYouSure', { x: this.announcements.find((_, j) => j == i).title }),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;
				this.announcements = this.announcements.filter((_, j) => j !== i);
				this.save(true);
				this.$root.dialog({
					type: 'success',
					text: this.$t('removed')
				});
			});
		},

		save(silent) {
			this.$root.api('admin/update-meta', {
				announcements: this.announcements
			}).then(() => {
				if (!silent) {
					this.$root.dialog({
						type: 'success',
						text: this.$t('saved')
					});
				}
			}).catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e
				});
			});
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
