<template>
<div class="hveuntkp">
	<portal to="header" v-if="user">
		<MkAvatar class="avatar" :user="user" :disable-preview="true"/>
		<Mfm 
			:text="$t('_rooms.roomOf', { user: user.name || user.username })"
			:plain="true" :nowrap="true" :custom-emojis="user.emojis" :is-note="false"
		/>
	</portal>

	<div class="controller _section" v-if="objectSelected">
		<div class="_content">
			<p class="name">{{ selectedFurnitureName }}</p>
			<XPreview ref="preview"/>
			<template v-if="selectedFurnitureInfo.props">
				<div v-for="k in Object.keys(selectedFurnitureInfo.props)" :key="k">
					<p>{{ k }}</p>
					<template v-if="selectedFurnitureInfo.props[k] === 'image'">
						<MkButton @click="chooseImage(k, $event)">{{ $t('_rooms.chooseImage') }}</MkButton>
					</template>
					<template v-else-if="selectedFurnitureInfo.props[k] === 'color'">
						<input type="color" :value="selectedFurnitureProps ? selectedFurnitureProps[k] : null" @change="updateColor(k, $event)"/>
					</template>
				</div>
			</template>
		</div>
		<div class="_content">
			<MkButton inline @click="translate()" :primary="isTranslateMode"><Fa :icon="faArrowsAlt"/> {{ $t('_rooms.translate') }}</MkButton>
			<MkButton inline @click="rotate()" :primary="isRotateMode"><Fa :icon="faUndo"/> {{ $t('_rooms.rotate') }}</MkButton>
			<MkButton inline v-if="isTranslateMode || isRotateMode" @click="exit()"><Fa :icon="faBan"/> {{ $t('_rooms.exit') }}</MkButton>
		</div>
		<div class="_content">
			<MkButton @click="remove()"><Fa :icon="faTrashAlt"/> {{ $t('_rooms.remove') }}</MkButton>
		</div>
	</div>

	<div class="menu _section" v-if="isMyRoom">
		<div class="_content">
			<MkButton @click="add()"><Fa :icon="faBoxOpen"/> {{ $t('_rooms.addFurniture') }}</MkButton>
		</div>
		<div class="_content">
			<MkSelect :value="roomType" @update:value="updateRoomType($event)">
				<template #label>{{ $t('_rooms.roomType') }}</template>
				<option value="default">{{ $t('_rooms._roomType.default') }}</option>
				<option value="washitsu">{{ $t('_rooms._roomType.washitsu') }}</option>
			</MkSelect>
			<label v-if="roomType === 'default'">
				<span>{{ $t('_rooms.carpetColor') }}</span>
				<input type="color" :value="carpetColor" @change="updateCarpetColor($event)"/>
			</label>
		</div>
		<div class="_content">
			<MkButton inline :disabled="!changed" primary @click="save()"><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
			<MkButton inline @click="clear()"><Fa :icon="faBroom"/> {{ $t('_rooms.clear') }}</MkButton>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Room } from '@/scripts/room/room';
import parseAcct from '../../../misc/acct/parse';
import XPreview from './preview.vue';
const storeItems = require('@/scripts/room/furnitures.json5');
import { faBoxOpen, faUndo, faArrowsAlt, faBan, faBroom } from '@fortawesome/free-solid-svg-icons';
import { faSave, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { query as urlQuery } from '../../../prelude/url';
import MkButton from '@/components/ui/button.vue';
import MkSelect from '@/components/ui/select.vue';
import { selectFile } from '@/scripts/select-file';
import * as os from '@/os';

let room: Room;

export default defineComponent({
	components: {
		XPreview,
		MkButton,
		MkSelect,
	},

	props: {
		acct: {
			type: String,
			required: true
		},
	},

	data() {
		return {
			user: null,
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

		this.user = await os.api('users/show', {
			...parseAcct(this.acct)
		});

		this.isMyRoom = this.$store.getters.isSignedIn && (this.$store.state.i.id === this.user.id);

		const roomInfo = await os.api('room/show', {
			userId: this.user.id
		});

		this.roomType = roomInfo.roomType;
		this.carpetColor = roomInfo.carpetColor;

		room = new Room(this.user, this.isMyRoom, roomInfo, this.$el, {
			graphicsQuality: this.$store.state.device.roomGraphicsQuality,
			onChangeSelect: obj => {
				this.objectSelected = obj != null;
				if (obj) {
					const f = room.findFurnitureById(obj.name);
					this.selectedFurnitureName = this.$t('_rooms._furnitures.' + f.type);
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
			os.dialog({
				type: 'warning',
				text: this.$t('leaveConfirm'),
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

	beforeUnmount() {
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
			const { canceled, result: id } = await os.dialog({
				type: null,
				title: this.$t('_rooms.addFurniture'),
				select: {
					items: storeItems.map(item => ({
						value: item.id, text: this.$t('_rooms._furnitures.' + item.id)
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
			os.api('room/update', {
				room: room.getRoomInfo()
			}).then(() => {
				this.changed = false;
				os.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			}).catch((e: any) => {
				os.dialog({
					type: 'error',
					text: e.message
				});
			});
		},

		clear() {
			os.dialog({
				type: 'warning',
				text: this.$t('_rooms.clearConfirm'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;
				room.removeAllFurnitures();
				this.changed = true;
			});
		},

		chooseImage(key, e) {
			selectFile(e.currentTarget || e.target, null, false).then(file => {
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

<style lang="scss" scoped>
.hveuntkp {
	position: relative;
	min-height: 500px;

	> ::v-deep(canvas) {
		display: block;
	}
}
</style>
