<template>
<div class="mk-profile-setting">
	<label class="avatar ui from group">
		<p>%i18n:desktop.tags.mk-profile-setting.avatar%</p><img class="avatar" :src="`${$root.$data.os.i.avatar_url}?thumbnail&size=64`" alt="avatar"/>
		<button class="ui" @click="updateAvatar">%i18n:desktop.tags.mk-profile-setting.choice-avatar%</button>
	</label>
	<label class="ui from group">
		<p>%i18n:desktop.tags.mk-profile-setting.name%</p>
		<input v-model="name" type="text" class="ui"/>
	</label>
	<label class="ui from group">
		<p>%i18n:desktop.tags.mk-profile-setting.location%</p>
		<input v-model="location" type="text" class="ui"/>
	</label>
	<label class="ui from group">
		<p>%i18n:desktop.tags.mk-profile-setting.description%</p>
		<textarea v-model="description" class="ui"></textarea>
	</label>
	<label class="ui from group">
		<p>%i18n:desktop.tags.mk-profile-setting.birthday%</p>
		<input v-model="birthday" type="date" class="ui"/>
	</label>
	<button class="ui primary" @click="save">%i18n:desktop.tags.mk-profile-setting.save%</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import updateAvatar from '../../scripts/update-avatar';
import notify from '../../scripts/notify';

export default Vue.extend({
	data() {
		return {
			name: this.$root.$data.os.i.name,
			location: this.$root.$data.os.i.location,
			description: this.$root.$data.os.i.description,
			birthday: this.$root.$data.os.i.birthday,
		};
	},
	methods: {
		updateAvatar() {
			updateAvatar(this.$root.$data.os.i);
		},
		save() {
			this.$root.$data.os.api('i/update', {
				name: this.name,
				location: this.location || null,
				description: this.description || null,
				birthday: this.birthday || null
			}).then(() => {
				notify('プロフィールを更新しました');
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-profile-setting
	> .avatar
		> img
			display inline-block
			vertical-align top
			width 64px
			height 64px
			border-radius 4px

		> button
			margin-left 8px

</style>

