<template>
<div class="hveuntkp">
	<div class="controller" v-if="this.selectedObject != null">
		<x-preview :object="this.selectedObject"/>
		<input type="range" min="-2.5" max="2.5" step="0.01" v-model="selectedObjectPositionX"/>
		<input type="range" min="-2.5" max="2.5" step="0.01" v-model="selectedObjectPositionZ"/>
		<input type="range" min="0" max="1.5" step="0.01" v-model="selectedObjectPositionY"/>
		<input type="range" min="-3.14" max="3.14" step="0.01" v-model="selectedObjectRotationX"/>
		<input type="range" min="-3.14" max="3.14" step="0.01" v-model="selectedObjectRotationZ"/>
		<input type="range" min="-3.14" max="3.14" step="0.01" v-model="selectedObjectRotationY"/>
		<ui-button @click="remove()">{{ $t('remove') }}</ui-button>
	</div>
	<div class="menu">
		<select v-model="selectedStoreItem">
			<option v-for="item in storeItems" :value="item.id" :key="item.id">{{ $t('items.' + item.id) }}</option>
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

let room;

export default Vue.extend({
	i18n: i18n(''),

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
			selectedObject: null,
			selectedObjectPositionX: 0,
			selectedObjectPositionY: 0,
			selectedObjectPositionZ: 0,
			selectedObjectRotationX: 0,
			selectedObjectRotationY: 0,
			selectedObjectRotationZ: 0,
		};
	},

	watch: {
		selectedObjectPositionX() {
			room.moveFurniture(parseFloat(this.selectedObjectPositionX, 10), parseFloat(this.selectedObjectPositionY, 10), parseFloat(this.selectedObjectPositionZ, 10));
		},

		selectedObjectPositionY() {
			room.moveFurniture(parseFloat(this.selectedObjectPositionX, 10), parseFloat(this.selectedObjectPositionY, 10), parseFloat(this.selectedObjectPositionZ, 10));
		},

		selectedObjectPositionZ() {
			room.moveFurniture(parseFloat(this.selectedObjectPositionX, 10), parseFloat(this.selectedObjectPositionY, 10), parseFloat(this.selectedObjectPositionZ, 10));
		},

		selectedObjectRotationX() {
			room.rotateFurniture(parseFloat(this.selectedObjectRotationX, 10), parseFloat(this.selectedObjectRotationY, 10), parseFloat(this.selectedObjectRotationZ, 10));
		},

		selectedObjectRotationY() {
			room.rotateFurniture(parseFloat(this.selectedObjectRotationX, 10), parseFloat(this.selectedObjectRotationY, 10), parseFloat(this.selectedObjectRotationZ, 10));
		},

		selectedObjectRotationZ() {
			room.rotateFurniture(parseFloat(this.selectedObjectRotationX, 10), parseFloat(this.selectedObjectRotationY, 10), parseFloat(this.selectedObjectRotationZ, 10));
		},

		selectedObject() {
			if (this.selectedObject == null) return;
			this.selectedObjectPositionX = this.selectedObject.position.x;
			this.selectedObjectPositionY = this.selectedObject.position.y;
			this.selectedObjectPositionZ = this.selectedObject.position.z;
			this.selectedObjectRotationX = this.selectedObject.rotation.x;
			this.selectedObjectRotationY = this.selectedObject.rotation.y;
			this.selectedObjectRotationZ = this.selectedObject.rotation.z;
		}
	},

	async mounted() {
		const user = await this.$root.api('users/show', {
			...parseAcct(this.acct)
		});

		const roomInfo = await this.$root.api('room/show', {
			userId: user.id
		});

		room = new Room(user, roomInfo.furnitures, 'medium', this.$el, obj => {
			this.selectedObject = obj;
		});
	},

	methods: {
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

	> .menu
		top 16px
		right 16px
		width 256px
	
</style>
