<template>
<section class="llvierxe _card">
	<div class="_title"><Fa :icon="faUser"/> {{ $t('profile') }}<small style="display: block; font-weight: normal; opacity: 0.6;">@{{ $store.state.i.username }}@{{ host }}</small></div>
	<div class="_content">
		<div class="header" :style="{ backgroundImage: $store.state.i.bannerUrl ? `url(${ $store.state.i.bannerUrl })` : null }" @click="changeBanner">
			<MkAvatar class="avatar" :user="$store.state.i" :disable-preview="true" :disable-link="true" @click.stop="changeAvatar"/>
		</div>
	
		<MkInput v-model:value="name" :max="30">
			<span>{{ $t('_profile.name') }}</span>
		</MkInput>

		<MkTextarea v-model:value="description" :max="500">
			<span>{{ $t('_profile.description') }}</span>
			<template #desc>{{ $t('_profile.youCanIncludeHashtags') }}</template>
		</MkTextarea>

		<MkInput v-model:value="location">
			<span>{{ $t('location') }}</span>
			<template #prefix><Fa :icon="faMapMarkerAlt"/></template>
		</MkInput>

		<MkInput v-model:value="birthday" type="date">
			<template #title>{{ $t('birthday') }}</template>
			<template #prefix><Fa :icon="faBirthdayCake"/></template>
		</MkInput>

		<details class="fields">
			<summary>{{ $t('_profile.metadata') }}</summary>
			<div class="row">
				<MkInput v-model:value="fieldName0">{{ $t('_profile.metadataLabel') }}</MkInput>
				<MkInput v-model:value="fieldValue0">{{ $t('_profile.metadataContent') }}</MkInput>
			</div>
			<div class="row">
				<MkInput v-model:value="fieldName1">{{ $t('_profile.metadataLabel') }}</MkInput>
				<MkInput v-model:value="fieldValue1">{{ $t('_profile.metadataContent') }}</MkInput>
			</div>
			<div class="row">
				<MkInput v-model:value="fieldName2">{{ $t('_profile.metadataLabel') }}</MkInput>
				<MkInput v-model:value="fieldValue2">{{ $t('_profile.metadataContent') }}</MkInput>
			</div>
			<div class="row">
				<MkInput v-model:value="fieldName3">{{ $t('_profile.metadataLabel') }}</MkInput>
				<MkInput v-model:value="fieldValue3">{{ $t('_profile.metadataContent') }}</MkInput>
			</div>
		</details>

		<MkSwitch v-model:value="isBot">{{ $t('flagAsBot') }}</MkSwitch>
		<MkSwitch v-model:value="isCat">{{ $t('flagAsCat') }}</MkSwitch>
	</div>
	<div class="_footer">
		<MkButton @click="save(true)" primary><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faUnlockAlt, faCogs, faUser, faMapMarkerAlt, faBirthdayCake } from '@fortawesome/free-solid-svg-icons';
import { faSave } from '@fortawesome/free-regular-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/ui/input.vue';
import MkTextarea from '@/components/ui/textarea.vue';
import MkSwitch from '@/components/ui/switch.vue';
import { host } from '@/config';
import { selectFile } from '@/scripts/select-file';
import * as os from '@/os';

export default defineComponent({
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
			selectFile(e.currentTarget || e.target, this.$t('avatar')).then(file => {
				os.api('i/update', {
					avatarId: file.id,
				});
			});
		},

		changeBanner(e) {
			selectFile(e.currentTarget || e.target, this.$t('banner')).then(file => {
				os.api('i/update', {
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

			os.api('i/update', {
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
					os.dialog({
						type: 'success',
						iconOnly: true, autoClose: true
					});
				}
			}).catch(err => {
				this.saving = false;
				os.dialog({
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
