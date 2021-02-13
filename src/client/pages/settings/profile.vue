<template>
<FormBase>
	<FormGroup>
		<div class="_formItem _formPanel llvierxe" :style="{ backgroundImage: $i.bannerUrl ? `url(${ $i.bannerUrl })` : null }">
			<MkAvatar class="avatar" :user="$i"/>
		</div>
		<FormButton @click="changeAvatar" primary>{{ $ts._profile.changeAvatar }}</FormButton>
		<FormButton @click="changeBanner" primary>{{ $ts._profile.changeBanner }}</FormButton>
	</FormGroup>

	<FormInput v-model:value="name" :max="30" manual-save>
		<span>{{ $ts._profile.name }}</span>
	</FormInput>

	<FormTextarea v-model:value="description" :max="500" tall manual-save>
		<span>{{ $ts._profile.description }}</span>
		<template #desc>{{ $ts._profile.youCanIncludeHashtags }}</template>
	</FormTextarea>

	<FormInput v-model:value="location" manual-save>
		<span>{{ $ts.location }}</span>
		<template #prefix><Fa :icon="faMapMarkerAlt"/></template>
	</FormInput>

	<FormInput v-model:value="birthday" type="date" manual-save>
		<span>{{ $ts.birthday }}</span>
		<template #prefix><Fa :icon="faBirthdayCake"/></template>
	</FormInput>

	<FormSelect v-model:value="lang">
		<template #label>{{ $ts.language }}</template>
		<option v-for="x in langs" :value="x[0]" :key="x[0]">{{ x[1] }}</option>
	</FormSelect>

	<FormGroup>
		<FormButton @click="editMetadata" primary>{{ $ts._profile.metadataEdit }}</FormButton>
		<template #caption>{{ $ts._profile.metadataDescription }}</template>
	</FormGroup>

	<FormSwitch v-model:value="isCat">{{ $ts.flagAsCat }}<template #desc>{{ $ts.flagAsCatDescription }}</template></FormSwitch>

	<FormSwitch v-model:value="isBot">{{ $ts.flagAsBot }}<template #desc>{{ $ts.flagAsBotDescription }}</template></FormSwitch>

	<FormSwitch v-model:value="alwaysMarkNsfw">{{ $ts.alwaysMarkSensitive }}</FormSwitch>
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
import FormSelect from '@/components/form/select.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import { host, langs } from '@/config';
import { selectFile } from '@/scripts/select-file';
import * as os from '@/os';

export default defineComponent({
	components: {
		FormButton,
		FormInput,
		FormTextarea,
		FormSwitch,
		FormSelect,
		FormBase,
		FormGroup,
	},
	
	emits: ['info'],

	data() {
		return {
			INFO: {
				title: this.$ts.profile,
				icon: faUser
			},
			host,
			langs,
			name: null,
			description: null,
			birthday: null,
			lang: null,
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
			alwaysMarkNsfw: false,
			saving: false,
			faSave, faUnlockAlt, faCogs, faUser, faMapMarkerAlt, faBirthdayCake
		}
	},

	created() {
		this.name = this.$i.name;
		this.description = this.$i.description;
		this.location = this.$i.location;
		this.birthday = this.$i.birthday;
		this.lang = this.$i.lang;
		this.avatarId = this.$i.avatarId;
		this.bannerId = this.$i.bannerId;
		this.isBot = this.$i.isBot;
		this.isCat = this.$i.isCat;
		this.alwaysMarkNsfw = this.$i.alwaysMarkNsfw;

		this.fieldName0 = this.$i.fields[0] ? this.$i.fields[0].name : null;
		this.fieldValue0 = this.$i.fields[0] ? this.$i.fields[0].value : null;
		this.fieldName1 = this.$i.fields[1] ? this.$i.fields[1].name : null;
		this.fieldValue1 = this.$i.fields[1] ? this.$i.fields[1].value : null;
		this.fieldName2 = this.$i.fields[2] ? this.$i.fields[2].name : null;
		this.fieldValue2 = this.$i.fields[2] ? this.$i.fields[2].value : null;
		this.fieldName3 = this.$i.fields[3] ? this.$i.fields[3].name : null;
		this.fieldValue3 = this.$i.fields[3] ? this.$i.fields[3].value : null;

		this.$watch('name', this.save);
		this.$watch('description', this.save);
		this.$watch('location', this.save);
		this.$watch('birthday', this.save);
		this.$watch('lang', this.save);
		this.$watch('isBot', this.save);
		this.$watch('isCat', this.save);
		this.$watch('alwaysMarkNsfw', this.save);
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {
		changeAvatar(e) {
			selectFile(e.currentTarget || e.target, this.$ts.avatar).then(file => {
				os.api('i/update', {
					avatarId: file.id,
				});
			});
		},

		changeBanner(e) {
			selectFile(e.currentTarget || e.target, this.$ts.banner).then(file => {
				os.api('i/update', {
					bannerId: file.id,
				});
			});
		},

		async editMetadata() {
			const { canceled, result } = await os.form(this.$ts._profile.metadata, {
				fieldName0: {
					type: 'string',
					label: this.$ts._profile.metadataLabel + ' 1',
					default: this.fieldName0,
				},
				fieldValue0: {
					type: 'string',
					label: this.$ts._profile.metadataContent + ' 1',
					default: this.fieldValue0,
				},
				fieldName1: {
					type: 'string',
					label: this.$ts._profile.metadataLabel + ' 2',
					default: this.fieldName1,
				},
				fieldValue1: {
					type: 'string',
					label: this.$ts._profile.metadataContent + ' 2',
					default: this.fieldValue1,
				},
				fieldName2: {
					type: 'string',
					label: this.$ts._profile.metadataLabel + ' 3',
					default: this.fieldName2,
				},
				fieldValue2: {
					type: 'string',
					label: this.$ts._profile.metadataContent + ' 3',
					default: this.fieldValue2,
				},
				fieldName3: {
					type: 'string',
					label: this.$ts._profile.metadataLabel + ' 4',
					default: this.fieldName3,
				},
				fieldValue3: {
					type: 'string',
					label: this.$ts._profile.metadataContent + ' 4',
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

		save() {
			this.saving = true;

			os.apiWithDialog('i/update', {
				name: this.name || null,
				description: this.description || null,
				location: this.location || null,
				birthday: this.birthday || null,
				lang: this.lang || null,
				isBot: !!this.isBot,
				isCat: !!this.isCat,
				alwaysMarkNsfw: !!this.alwaysMarkNsfw,
			}).then(i => {
				this.saving = false;
				this.$i.avatarId = i.avatarId;
				this.$i.avatarUrl = i.avatarUrl;
				this.$i.bannerId = i.bannerId;
				this.$i.bannerUrl = i.bannerUrl;
			}).catch(err => {
				this.saving = false;
			});
		},
	}
});
</script>

<style lang="scss" scoped>
.llvierxe {
	position: relative;
	height: 150px;
	background-size: cover;
	background-position: center;

	> * {
		pointer-events: none;
	}

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
		box-shadow: 0 0 0 6px rgba(0, 0, 0, 0.5);
	}
}
</style>
