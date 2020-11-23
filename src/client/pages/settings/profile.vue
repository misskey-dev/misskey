<template>
<FormBase class="llvierxe">
	<div class="header _formItem" :style="{ backgroundImage: $store.state.i.bannerUrl ? `url(${ $store.state.i.bannerUrl })` : null }" @click="changeBanner">
		<MkAvatar class="avatar" :user="$store.state.i" :disable-preview="true" :disable-link="true" @click.stop="changeAvatar"/>
	</div>

	<FormInput v-model:value="name" :max="30">
		<span>{{ $t('_profile.name') }}</span>
	</FormInput>

	<FormTextarea v-model:value="description" :max="500">
		<span>{{ $t('_profile.description') }}</span>
		<template #desc>{{ $t('_profile.youCanIncludeHashtags') }}</template>
	</FormTextarea>

	<FormInput v-model:value="location">
		<span>{{ $t('location') }}</span>
		<template #prefix><Fa :icon="faMapMarkerAlt"/></template>
	</FormInput>

	<FormInput v-model:value="birthday" type="date">
		<span>{{ $t('birthday') }}</span>
		<template #prefix><Fa :icon="faBirthdayCake"/></template>
	</FormInput>

	<FormGroup>
		<FormButton @click="editMetadata" primary>{{ $t('metadataEdit') }}</FormButton>
		<template #caption>{{ $t('_profile.metadataDescription') }}</template>
	</FormGroup>

	<FormSwitch v-model:value="isCat">{{ $t('flagAsCat') }}<template #desc>{{ $t('flagAsCatDescription') }}</template></FormSwitch>

	<FormSwitch v-model:value="isBot">{{ $t('flagAsBot') }}<template #desc>{{ $t('flagAsBotDescription') }}</template></FormSwitch>

	<FormButton @click="save(true)" primary><Fa :icon="faSave"/> {{ $t('save') }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faUnlockAlt, faCogs, faUser, faMapMarkerAlt, faBirthdayCake } from '@fortawesome/free-solid-svg-icons';
import { faSave } from '@fortawesome/free-regular-svg-icons';
import FormButton from '@/components/form/button.vue';
import FormInput from '@/components/form/input.vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormTuple from '@/components/form/tuple.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import { host } from '@/config';
import { selectFile } from '@/scripts/select-file';
import * as os from '@/os';

export default defineComponent({
	components: {
		FormButton,
		FormInput,
		FormTextarea,
		FormSwitch,
		FormTuple,
		FormBase,
		FormGroup,
	},
	
	emits: ['info'],

	data() {
		return {
			INFO: {
				title: this.$t('profile'),
				icon: faUser
			},
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

	mounted() {
		this.$emit('info', this.INFO);
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

		async editMetadata() {
			const { canceled, result } = await os.form(this.$t('_profile.metadata'), {
				fieldName0: {
					type: 'string',
					label: this.$t('_profile.metadataLabel') + ' 1',
					default: this.fieldName0,
				},
				fieldValue0: {
					type: 'string',
					label: this.$t('_profile.metadataContent') + ' 1',
					default: this.fieldValue0,
				},
				fieldName1: {
					type: 'string',
					label: this.$t('_profile.metadataLabel') + ' 2',
					default: this.fieldName1,
				},
				fieldValue1: {
					type: 'string',
					label: this.$t('_profile.metadataContent') + ' 2',
					default: this.fieldValue1,
				},
				fieldName2: {
					type: 'string',
					label: this.$t('_profile.metadataLabel') + ' 3',
					default: this.fieldName2,
				},
				fieldValue2: {
					type: 'string',
					label: this.$t('_profile.metadataContent') + ' 3',
					default: this.fieldValue2,
				},
				fieldName3: {
					type: 'string',
					label: this.$t('_profile.metadataLabel') + ' 4',
					default: this.fieldName3,
				},
				fieldValue3: {
					type: 'string',
					label: this.$t('_profile.metadataContent') + ' 4',
					default: this.fieldValue3,
				},
			});
			if (canceled) return;

			this.fieldName0 = result.fieldName0;
			this.fieldValue0 = result.fieldValue0;
			this.fieldName1 = result.fieldName1;
			this.fieldValue1 = result.fieldValue1;
			this.fieldName2 = result.fieldName2;
			this.fieldValue2 = result.fieldValue2;
			this.fieldName3 = result.fieldName3;
			this.fieldValue3 = result.fieldValue3;

			const fields = [
				{ name: this.fieldName0, value: this.fieldValue0 },
				{ name: this.fieldName1, value: this.fieldValue1 },
				{ name: this.fieldName2, value: this.fieldValue2 },
				{ name: this.fieldName3, value: this.fieldValue3 },
			];

			os.api('i/update', {
				fields,
			}).then(i => {
				os.success();
			}).catch(err => {
				os.dialog({
					type: 'error',
					text: err.id
				});
			});
		},

		save(notify) {
			this.saving = true;

			os.api('i/update', {
				name: this.name || null,
				description: this.description || null,
				location: this.location || null,
				birthday: this.birthday || null,
				isBot: !!this.isBot,
				isCat: !!this.isCat,
			}).then(i => {
				this.saving = false;
				this.$store.state.i.avatarId = i.avatarId;
				this.$store.state.i.avatarUrl = i.avatarUrl;
				this.$store.state.i.bannerId = i.bannerId;
				this.$store.state.i.bannerUrl = i.bannerUrl;

				if (notify) {
					os.success();
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
}
</style>
