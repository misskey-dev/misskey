<template>
<div class="hveuntkp">
	<div class="controller" v-if="objectSelected">
		<section>
			<p class="name">{{ selectedFurnitureName }}</p>
			<x-preview ref="preview"/>
			<template v-if="selectedFurnitureInfo.props">
				<div v-for="k in Object.keys(selectedFurnitureInfo.props)" :key="k">
					<p>{{ k }}</p>
					<template v-if="selectedFurnitureInfo.props[k] === 'image'">
						<ui-button @click="chooseImage(k)">{{ $t('chooseImage') }}</ui-button>
					</template>
					<template v-else-if="selectedFurnitureInfo.props[k] === 'color'">
						<input type="color" :value="selectedFurnitureProps ? selectedFurnitureProps[k] : null" @change="updateColor(k, $event)"/>
					</template>
				</div>
			</template>
		</section>
		<section>
			<ui-button @click="translate()" :primary="isTranslateMode"><fa :icon="faArrowsAlt"/> {{ $t('translate') }}</ui-button>
			<ui-button @click="rotate()" :primary="isRotateMode"><fa :icon="faUndo"/> {{ $t('rotate') }}</ui-button>
			<ui-button v-if="isTranslateMode || isRotateMode" @click="exit()"><fa :icon="faBan"/> {{ $t('exit') }}</ui-button>
		</section>
		<section>
			<ui-button @click="remove()"><fa :icon="faTrashAlt"/> {{ $t('remove') }}</ui-button>
		</section>
	</div>

	<div class="menu" v-if="isMyRoom">
		<section>
			<ui-button @click="add()"><fa :icon="faBoxOpen"/> {{ $t('add-furniture') }}</ui-button>
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
			<ui-button :primary="changed" @click="save()"><fa :icon="faSave"/> {{ $t('save') }}</ui-button>
			<ui-button @click="clear()"><fa :icon="faBroom"/> {{ $t('clear') }}</ui-button>
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
import { faBoxOpen, faUndo, faArrowsAlt, faBan, faBroom } from '@fortawesome/free-solid-svg-icons';
import { faSave, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { query as urlQuery } from '../../../../../../prelude/url';

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
			carpetColor: null,
			isTranslateMode: false,
			isRotateMode: false,
			isMyRoom: false,
			changed: false,
			faBoxOpen, faSave, faTrashAlt, faUndo, faArrowsAlt, faBan, faBroom,
		};
	},

	async mounted() {
		window.addEventListener('beforeunload', this.beforeunload);

		const user = await this.$root.api('users/show', {
			...parseAcct(this.acct)
		});

		this.isMyRoom = this.$store.getters.isSignedIn && this.$store.state.i.id === user.id;

		const roomInfo = await this.$root.api('room/show', {
			userId: user.id
		});

		this.roomType = roomInfo.roomType;
		this.carpetColor = roomInfo.carpetColor;

		room = new Room(user, this.isMyRoom, roomInfo, this.$el, {
			graphicsQuality: this.$store.state.device.roomGraphicsQuality,
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
					});
				}
			},
			useOrthographicCamera: this.$store.state.device.roomUseOrthographicCamera
		});
	},

	beforeRouteLeave(to, from, next) {
		if (this.changed) {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('leave-confirm'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) {
					next(false);
				} else {
					next();
				}
			});
		} else {
			next();
		}
	},

	beforeDestroy() {
		room.destroy();
		window.removeEventListener('beforeunload', this.beforeunload);
	},

	methods: {
		beforeunload(e: BeforeUnloadEvent) {
			if (this.changed) {
				e.preventDefault();
				e.returnValue = '';
			}
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
			this.changed = true;
		},

		remove() {
			this.isTranslateMode = false;
			this.isRotateMode = false;
			room.removeFurniture();
			this.changed = true;
		},

		save() {
			this.$root.api('room/update', {
				room: room.getRoomInfo()
			}).then(() => {
				this.changed = false;
				this.$root.dialog({
					type: 'success',
					text: this.$t('saved')
				});
			}).catch((e: any) => {
				this.$root.dialog({
					type: 'error',
					text: e.message
				});
			});
		},

		clear() {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('clear-confirm'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;
				room.removeAllFurnitures();
				this.changed = true;
			});
		},

		chooseImage(key) {
			this.$chooseDriveFile({
				multiple: false
			}).then(file => {
				room.updateProp(key, `/proxy/?${urlQuery({ url: file.thumbnailUrl })}`);
				this.$refs.preview.selected(room.getSelectedObject());
				this.changed = true;
			});
		},

		updateColor(key, ev) {
			room.updateProp(key, ev.target.value);
			this.$refs.preview.selected(room.getSelectedObject());
			this.changed = true;
		},

		updateCarpetColor(ev) {
			room.updateCarpetColor(ev.target.value);
			this.carpetColor = ev.target.value;
			this.changed = true;
		},

		updateRoomType(type) {
			room.changeRoomType(type);
			this.roomType = type;
			this.changed = true;
		},

		translate() {
			if (this.isTranslateMode) {
				this.exit();
			} else {
				this.isRotateMode = false;
				this.isTranslateMode = true;
				room.enterTransformMode('translate');
			}
			this.changed = true;
		},

		rotate() {
			if (this.isRotateMode) {
				this.exit();
			} else {
				this.isTranslateMode = false;
				this.isRotateMode = true;
				room.enterTransformMode('rotate');
			}
			this.changed = true;
		},

		exit() {
			this.isTranslateMode = false;
			this.isRotateMode = false;
			room.exitTransformMode();
			this.changed = true;
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
