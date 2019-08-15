<template>
<div class="hveuntkp">
	<div class="controller" v-if="objectSelected">
		<p class="name">{{ selectedFurnitureName }}</p>
		<x-preview ref="preview"/>
		<input type="range" min="-2.5" max="2.5" step="0.01" @input="onPositionSliderChange()" ref="positionX"/>
		<input type="range" min="-2.5" max="2.5" step="0.01" @input="onPositionSliderChange()" ref="positionZ"/>
		<input type="range" min="0" max="1.5" step="0.01" @input="onPositionSliderChange()" ref="positionY"/>
		<input type="range" min="-3.14" max="3.14" step="0.01" @input="onRotationSliderChange()" ref="rotationX"/>
		<input type="range" min="-3.14" max="3.14" step="0.01" @input="onRotationSliderChange()" ref="rotationZ"/>
		<input type="range" min="-3.14" max="3.14" step="0.01" @input="onRotationSliderChange()" ref="rotationY"/>
		<div v-if="selectedFurnitureInfo.props">
			<div v-for="k in Object.keys(selectedFurnitureInfo.props)">
				<p>{{ k }}</p>
				<ui-button @click="chooseImage(k)">{{ $t('chooseImage') }}</ui-button>
			</div>
		</div>
		<ui-button @click="remove()">{{ $t('remove') }}</ui-button>
	</div>
	<div class="menu">
		<select v-model="selectedStoreItem">
			<option v-for="item in storeItems" :value="item.id" :key="item.id">{{ $t('furnitures.' + item.id) }}</option>
		</select>
		<ui-button @click="add()">{{ $t('add') }}</ui-button>
		<ui-button @click="save()">{{ $t('save') }}</ui-button>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import { Room } from '../../../scripts/room/room';
import parseAcct from '../../../../../../misc/acct/parse';
import XPreview from './preview.vue';
const storeItems = require('../../../scripts/room/furnitures.json5');

let room: Room;

export default Vue.extend({
	i18n: i18n('room'),

	components: {
		XPreview
	},

	props: {
		acct: {
			type: String,
			required: true
		},
	},

	data() {
		return {
			storeItems: storeItems,
			selectedStoreItem: null,
			objectSelected: false,
			selectedFurnitureName: null,
			selectedFurnitureInfo: null,
		};
	},

	async mounted() {
		const user = await this.$root.api('users/show', {
			...parseAcct(this.acct)
		});

		const roomInfo = await this.$root.api('room/show', {
			userId: user.id
		});

		room = new Room(user, roomInfo.furnitures, this.$el, {
			graphicsQuality: 'ultra',
			onChangeSelect: obj => {
				this.objectSelected = obj != null;
				if (obj) {
					const f = room.findFurnitureById(obj.name);
					this.selectedFurnitureName = this.$t('furnitures.' + f.type);
					this.selectedFurnitureInfo = storeItems.find(x => x.id === f.type);
					this.$nextTick(() => {
						this.$refs.preview.selected(obj);
						this.$refs.positionX.value = obj.position.x;
						this.$refs.positionY.value = obj.position.y;
						this.$refs.positionZ.value = obj.position.z;
						this.$refs.rotationX.value = obj.rotation.x;
						this.$refs.rotationY.value = obj.rotation.y;
						this.$refs.rotationZ.value = obj.rotation.z;
					});
				}
			},
			useOrthographicCamera: true
		});
	},

	methods: {
		onPositionSliderChange() {
			room.moveFurniture(parseFloat(this.$refs.positionX.value, 10), parseFloat(this.$refs.positionY.value, 10), parseFloat(this.$refs.positionZ.value, 10));
		},

		onRotationSliderChange() {
			room.rotateFurniture(parseFloat(this.$refs.rotationX.value, 10), parseFloat(this.$refs.rotationY.value, 10), parseFloat(this.$refs.rotationZ.value, 10));
		},

		add() {
			if (this.selectedStoreItem == null) return;
			room.addFurniture(this.selectedStoreItem);
		},

		remove() {
			room.removeFurniture();
		},

		save() {
			this.$root.api('room/update', {
				room: {
					furnitures: room.getFurnitures()
				}
			});
		},

		chooseImage(key) {
			this.$chooseDriveFile({
				multiple: false
			}).then(file => {
				room.updateProp(key, file.thumbnailUrl);
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.hveuntkp
	> .controller
	> .menu
		position fixed
		z-index 1
		padding 16px
		background rgba(0, 0, 0, 0.5)

	> .controller
		top 16px
		left 16px
		width 256px

		> .name
			margin 0
			color #fff

	> .menu
		top 16px
		right 16px
		width 256px
	
</style>
