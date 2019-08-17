<template>
<div class="hveuntkp">
	<div class="controller" v-if="objectSelected">
		<section>
			<p class="name">{{ selectedFurnitureName }}</p>
			<x-preview ref="preview"/>
			<input type="range" min="-2.5" max="2.5" step="0.01" @input="onPositionSliderChange()" ref="positionX"/>
			<input type="range" min="-2.5" max="2.5" step="0.01" @input="onPositionSliderChange()" ref="positionZ"/>
			<input type="range" min="0" max="1.5" step="0.01" @input="onPositionSliderChange()" ref="positionY"/>
			<input type="range" min="-3.14" max="3.14" step="0.01" @input="onRotationSliderChange()" ref="rotationX"/>
			<input type="range" min="-3.14" max="3.14" step="0.01" @input="onRotationSliderChange()" ref="rotationZ"/>
			<input type="range" min="-3.14" max="3.14" step="0.01" @input="onRotationSliderChange()" ref="rotationY"/>
		</section>
		<section v-if="selectedFurnitureInfo.props">
			<div v-for="k in Object.keys(selectedFurnitureInfo.props)">
				<p>{{ k }}</p>
				<template v-if="selectedFurnitureInfo.props[k] === 'image'">
					<ui-button @click="chooseImage(k)">{{ $t('chooseImage') }}</ui-button>
				</template>
				<template v-else-if="selectedFurnitureInfo.props[k] === 'color'">
					<input type="color" :value="selectedFurnitureProps[k]" @change="updateColor(k, $event)"/>
				</template>
			</div>
		</section>
		<section>
			<ui-button @click="remove()">{{ $t('remove') }}</ui-button>
		</section>
	</div>
	<div class="menu">
		<section>
			<ui-button @click="add()">{{ $t('add-furniture') }}</ui-button>
		</section>
		<section>
			<ui-select :value="roomType" @input="updateRoomType($event)">
				<template #label>{{ $t('room-type') }}</template>
				<option value="default">{{ $t('rooms.default') }}</option>
				<option value="washitsu">{{ $t('rooms.washitsu') }}</option>
			</ui-select>
			<label v-if="roomType === 'default'">
				<span>{{ $t('carpet-color') }}</span>
				<input type="color" :value="carpetColor" @change="updateCarpetColor($event)"/>
			</label>
		</section>
		<section>
			<ui-button primary @click="save()">{{ $t('save') }}</ui-button>
		</section>
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
			objectSelected: false,
			selectedFurnitureName: null,
			selectedFurnitureInfo: null,
			selectedFurnitureProps: null,
			roomType: null,
			carpetColor: null
		};
	},

	async mounted() {
		const user = await this.$root.api('users/show', {
			...parseAcct(this.acct)
		});

		const roomInfo = await this.$root.api('room/show', {
			userId: user.id
		});

		this.roomType = roomInfo.roomType;
		this.carpetColor = roomInfo.carpetColor;

		room = new Room(user, roomInfo, this.$el, {
			graphicsQuality: 'medium',
			onChangeSelect: obj => {
				this.objectSelected = obj != null;
				if (obj) {
					const f = room.findFurnitureById(obj.name);
					this.selectedFurnitureName = this.$t('furnitures.' + f.type);
					this.selectedFurnitureInfo = storeItems.find(x => x.id === f.type);
					this.selectedFurnitureProps = f.props
						? JSON.parse(JSON.stringify(f.props)) // Disable reactivity
						: null;
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

		async add() {
			const { canceled, result: id } = await this.$root.dialog({
				type: null,
				title: this.$t('add-furniture'),
				select: {
					items: storeItems.map(item => ({
						value: item.id, text: this.$t('furnitures.' + item.id)
					}))
				},
				showCancelButton: true
			});
			if (canceled) return;
			room.addFurniture(id);
		},

		remove() {
			room.removeFurniture();
		},

		save() {
			this.$root.api('room/update', {
				room: room.getRoomInfo()
			});
		},

		chooseImage(key) {
			this.$chooseDriveFile({
				multiple: false
			}).then(file => {
				room.updateProp(key, file.thumbnailUrl);
				this.$refs.preview.selected(room.getSelectedObject());
			});
		},

		updateColor(key, ev) {
			room.updateProp(key, ev.target.value);
			this.$refs.preview.selected(room.getSelectedObject());
		},

		updateCarpetColor(ev) {
			room.updateCarpetColor(ev.target.value);
			this.carpetColor = ev.target.value;
		},

		updateRoomType(type) {
			room.changeRoomType(type);
			this.roomType = type;
		},
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
		background var(--face)
		color var(--text)

		> section
			padding 16px 0

			&:first-child
				padding-top 0

			&:last-child
				padding-bottom 0

			&:not(:last-child)
				border-bottom solid 1px var(--faceDivider)

	> .controller
		top 16px
		left 16px
		width 256px

		> section
			> .name
				margin 0

	> .menu
		top 16px
		right 16px
		width 256px
	
</style>
