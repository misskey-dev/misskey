<template>
<section class="llvierxe _card">
	<div class="_title"><fa :icon="faUser"/> {{ $t('profile') }}<small style="display: block; font-weight: normal; opacity: 0.6;">@{{ $store.state.i.username }}@{{ host }}</small></div>
	<div class="_content">
		<div class="header" :style="{ backgroundImage: $store.state.i.bannerUrl ? `url(${ $store.state.i.bannerUrl })` : null }" @click="changeBanner">
			<mk-avatar class="avatar" :user="$store.state.i" :disable-preview="true" :disable-link="true" @click.stop="changeAvatar"/>
		</div>
	
		<mk-input v-model="name" :max="30">
			<span>{{ $t('_profile.name') }}</span>
		</mk-input>

		<mk-textarea v-model="description" :max="500">
			<span>{{ $t('_profile.description') }}</span>
			<template #desc>{{ $t('_profile.youCanIncludeHashtags') }}</template>
		</mk-textarea>

		<mk-input v-model="location">
			<span>{{ $t('location') }}</span>
			<template #prefix><fa :icon="faMapMarkerAlt"/></template>
		</mk-input>

		<mk-input v-model="birthday" type="date">
			<template #title>{{ $t('birthday') }}</template>
			<template #prefix><fa :icon="faBirthdayCake"/></template>
		</mk-input>

		<details class="fields">
			<summary>{{ $t('_profile.metadata') }}</summary>
			<div class="row">
				<mk-input v-model="fieldName0">{{ $t('_profile.metadataLabel') }}</mk-input>
				<mk-input v-model="fieldValue0">{{ $t('_profile.metadataContent') }}</mk-input>
			</div>
			<div class="row">
				<mk-input v-model="fieldName1">{{ $t('_profile.metadataLabel') }}</mk-input>
				<mk-input v-model="fieldValue1">{{ $t('_profile.metadataContent') }}</mk-input>
			</div>
			<div class="row">
				<mk-input v-model="fieldName2">{{ $t('_profile.metadataLabel') }}</mk-input>
				<mk-input v-model="fieldValue2">{{ $t('_profile.metadataContent') }}</mk-input>
			</div>
			<div class="row">
				<mk-input v-model="fieldName3">{{ $t('_profile.metadataLabel') }}</mk-input>
				<mk-input v-model="fieldValue3">{{ $t('_profile.metadataContent') }}</mk-input>
			</div>
		</details>

		<mk-switch v-model="isBot">{{ $t('flagAsBot') }}</mk-switch>
		<mk-switch v-model="isCat">{{ $t('flagAsCat') }}</mk-switch>
	</div>
	<div class="_footer">
		<mk-button @click="save(true)" primary><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faUnlockAlt, faCogs, faUser, faMapMarkerAlt, faBirthdayCake } from '@fortawesome/free-solid-svg-icons';
import { faSave } from '@fortawesome/free-regular-svg-icons';
import MkButton from '../../components/ui/button.vue';
import MkInput from '../../components/ui/input.vue';
import MkTextarea from '../../components/ui/textarea.vue';
import MkSwitch from '../../components/ui/switch.vue';
import i18n from '../../i18n';
import { host } from '../../config';
import { selectFile } from '../../scripts/select-file';

export default Vue.extend({
	i18n,

	components: {
		MkButton,
		MkInput,
		MkTextarea,
		MkSwitch,
	},
	
	data() {
		return {
			host,
			name: null,
			description: null,
			birthday: null,
			location: null,
			fieldName0: null,
			fieldValue0: null,
			fieldName1: null,
			fieldValue1: null,
			fieldName2: null,
			fieldValue2: null,
			fieldName3: null,
			fieldValue3: null,
			avatarId: null,
			bannerId: null,
			isBot: false,
			isCat: false,
			saving: false,
			faSave, faUnlockAlt, faCogs, faUser, faMapMarkerAlt, faBirthdayCake
		}
	},

	created() {
		this.name = this.$store.state.i.name;
		this.description = this.$store.state.i.description;
		this.location = this.$store.state.i.location;
		this.birthday = this.$store.state.i.birthday;
		this.avatarId = this.$store.state.i.avatarId;
		this.bannerId = this.$store.state.i.bannerId;
		this.isBot = this.$store.state.i.isBot;
		this.isCat = this.$store.state.i.isCat;

		this.fieldName0 = this.$store.state.i.fields[0] ? this.$store.state.i.fields[0].name : null;
		this.fieldValue0 = this.$store.state.i.fields[0] ? this.$store.state.i.fields[0].value : null;
		this.fieldName1 = this.$store.state.i.fields[1] ? this.$store.state.i.fields[1].name : null;
		this.fieldValue1 = this.$store.state.i.fields[1] ? this.$store.state.i.fields[1].value : null;
		this.fieldName2 = this.$store.state.i.fields[2] ? this.$store.state.i.fields[2].name : null;
		this.fieldValue2 = this.$store.state.i.fields[2] ? this.$store.state.i.fields[2].value : null;
		this.fieldName3 = this.$store.state.i.fields[3] ? this.$store.state.i.fields[3].name : null;
		this.fieldValue3 = this.$store.state.i.fields[3] ? this.$store.state.i.fields[3].value : null;
	},

	methods: {
		changeAvatar(e) {
			selectFile(this, e.currentTarget || e.target, this.$t('avatar')).then(file => {
				this.$root.api('i/update', {
					avatarId: file.id,
				});
			});
		},

		changeBanner(e) {
			selectFile(this, e.currentTarget || e.target, this.$t('banner')).then(file => {
				this.$root.api('i/update', {
					bannerId: file.id,
				});
			});
		},

		save(notify) {
			const fields = [
				{ name: this.fieldName0, value: this.fieldValue0 },
				{ name: this.fieldName1, value: this.fieldValue1 },
				{ name: this.fieldName2, value: this.fieldValue2 },
				{ name: this.fieldName3, value: this.fieldValue3 },
			];

			this.saving = true;

			this.$root.api('i/update', {
				name: this.name || null,
				description: this.description || null,
				location: this.location || null,
				birthday: this.birthday || null,
				fields,
				isBot: !!this.isBot,
				isCat: !!this.isCat,
			}).then(i => {
				this.saving = false;
				this.$store.state.i.avatarId = i.avatarId;
				this.$store.state.i.avatarUrl = i.avatarUrl;
				this.$store.state.i.bannerId = i.bannerId;
				this.$store.state.i.bannerUrl = i.bannerUrl;

				if (notify) {
					this.$root.dialog({
						type: 'success',
						iconOnly: true, autoClose: true
					});
				}
			}).catch(err => {
				this.saving = false;
				this.$root.dialog({
					type: 'error',
					text: err.id
				});
			});
		},
	}
});
</script>

<style lang="scss" scoped>
.llvierxe {
	> ._content {
		> .header {
			position: relative;
			height: 150px;
			overflow: hidden;
			background-size: cover;
			background-position: center;
			border-radius: 5px;
			border: solid 1px var(--divider);
			box-sizing: border-box;
			cursor: pointer;

			> .avatar {
				position: absolute;
				top: 0;
				bottom: 0;
				left: 0;
				right: 0;
				display: block;
				width: 72px;
				height: 72px;
				margin: auto;
				cursor: pointer;
				box-shadow: 0 0 0 6px rgba(0, 0, 0, 0.5);
			}
		}

		> .fields {
			> .row {
				> * {
					display: inline-block;
					width: 50%;
					margin-bottom: 0;
				}
			}
		}
	}
}
</style>
