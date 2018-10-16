<template>
<div class="profile">
	<label class="avatar ui from group">
		<p>%i18n:@avatar%</p>
		<img class="avatar" :src="$store.state.i.avatarUrl" alt="avatar"/>
		<button class="ui" @click="updateAvatar">%i18n:@choice-avatar%</button>
	</label>
	<label class="ui from group">
		<ui-input v-model="name" type="text">%i18n:@name%</ui-input>
	</label>
	<label class="ui from group">
		<ui-input v-model="location" type="text">%i18n:@location%</ui-input>
	</label>
	<label class="ui from group">
		<ui-textarea v-model="description">%i18n:@description%</ui-textarea>
	</label>
	<label class="ui from group">
		<p>%i18n:@birthday%</p>
		<input type="date" v-model="birthday"/>
	</label>
	<ui-button primary @click="save">%i18n:@save%</ui-button>
	<section>
		<h2>%i18n:@locked-account%</h2>
		<ui-switch v-model="isLocked" @change="save(false)">%i18n:@is-locked%</ui-switch>
		<ui-switch v-model="carefulBot" @change="save(false)">%i18n:@careful-bot%</ui-switch>
	</section>
	<section>
		<h2>%i18n:@other%</h2>
		<ui-switch v-model="isBot" @change="save(false)">%i18n:@is-bot%</ui-switch>
		<ui-switch v-model="isCat" @change="save(false)">%i18n:@is-cat%</ui-switch>
		<ui-switch v-model="alwaysMarkNsfw">%i18n:common.always-mark-nsfw%</ui-switch>
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
			isBot: false,
			isCat: false,
			isLocked: false,
			carefulBot: false,
		};
	},
	computed: {
		alwaysMarkNsfw: {
			get() { return this.$store.state.i.settings.alwaysMarkNsfw; },
			set(value) { (this as any).api('i/update', { alwaysMarkNsfw: value }); }
		},
	},
	created() {
		this.name = this.$store.state.i.name || '';
		this.location = this.$store.state.i.profile.location;
		this.description = this.$store.state.i.description;
		this.birthday = this.$store.state.i.profile.birthday;
		this.isCat = this.$store.state.i.isCat;
		this.isBot = this.$store.state.i.isBot;
		this.isLocked = this.$store.state.i.isLocked;
		this.carefulBot = this.$store.state.i.carefulBot;
	},
	methods: {
		updateAvatar() {
			(this as any).apis.updateAvatar();
		},
		save(notify) {
			(this as any).api('i/update', {
				name: this.name || null,
				location: this.location || null,
				description: this.description || null,
				birthday: this.birthday || null,
				isCat: this.isCat,
				isBot: this.isBot,
				isLocked: this.isLocked,
				carefulBot: this.carefulBot
			}).then(() => {
				if (notify) {
					(this as any).apis.notify('%i18n:@profile-updated%');
				}
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

