<template>
<div class="profile">
	<label class="avatar ui from group">
		<p>%i18n:@avatar%</p>
		<img class="avatar" :src="`${os.i.avatarUrl}?thumbnail&size=64`" alt="avatar"/>
		<button class="ui" @click="updateAvatar">%i18n:@choice-avatar%</button>
	</label>
	<label class="ui from group">
		<p>%i18n:@name%</p>
		<input v-model="name" type="text" class="ui"/>
	</label>
	<label class="ui from group">
		<p>%i18n:@location%</p>
		<input v-model="location" type="text" class="ui"/>
	</label>
	<label class="ui from group">
		<p>%i18n:@description%</p>
		<textarea v-model="description" class="ui"></textarea>
	</label>
	<label class="ui from group">
		<p>%i18n:@birthday%</p>
		<el-date-picker v-model="birthday" type="date" value-format="yyyy-MM-dd"/>
	</label>
	<button class="ui primary" @click="save">%i18n:@save%</button>
	<section>
		<h2>その他</h2>
		<mk-switch v-model="os.i.isBot" @change="onChangeIsBot" text="このアカウントはbotです"/>
	</section>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	data() {
		return {
			name: null,
			location: null,
			description: null,
			birthday: null,
		};
	},
	created() {
		this.name = (this as any).os.i.name || '';
		this.location = (this as any).os.i.profile.location;
		this.description = (this as any).os.i.description;
		this.birthday = (this as any).os.i.profile.birthday;
	},
	methods: {
		updateAvatar() {
			(this as any).apis.updateAvatar();
		},
		save() {
			(this as any).api('i/update', {
				name: this.name || null,
				location: this.location || null,
				description: this.description || null,
				birthday: this.birthday || null
			}).then(() => {
				(this as any).apis.notify('プロフィールを更新しました');
			});
		},
		onChangeIsBot() {
			(this as any).api('i/update', {
				isBot: (this as any).os.i.isBot
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.profile
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

