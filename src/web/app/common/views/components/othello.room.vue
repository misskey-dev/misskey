<template>
<div class="root">
	<header><b>{{ game.user1.name }}</b> vs <b>{{ game.user2.name }}</b></header>

	<p>ゲームの設定</p>

	<el-select class="map" v-model="mapName" placeholder="マップを選択" @change="onMapChange">
		<el-option label="ランダム" :value="null"/>
		<el-option-group v-for="c in mapCategories" :key="c" :label="c">
			<el-option v-for="m in maps" v-if="m.category == c" :key="m.name" :label="m.name" :value="m.name">
				<span style="float: left">{{ m.name }}</span>
				<span style="float: right; color: #8492a6; font-size: 13px" v-if="m.author">(by <i>{{ m.author }}</i>)</span>
			</el-option>
		</el-option-group>
	</el-select>

	<div class="board" v-if="game.settings.map != null" :style="{ 'grid-template-rows': `repeat(${ game.settings.map.length }, 1fr)`, 'grid-template-columns': `repeat(${ game.settings.map[0].length }, 1fr)` }">
		<div v-for="(x, i) in game.settings.map.join('')"
			:class="{ none: x == ' ' }"
			@click="onPixelClick(i, x)"
		>
			<template v-if="x == 'b'">%fa:circle%</template>
			<template v-if="x == 'w'">%fa:circle R%</template>
		</div>
	</div>

	<div class="rules">
		<mk-switch v-model="game.settings.is_llotheo" @change="updateSettings" text="石の少ない方が勝ち(ロセオ)"/>
		<mk-switch v-model="game.settings.looped_board" @change="updateSettings" text="ループマップ"/>
		<mk-switch v-model="game.settings.can_put_everywhere" @change="updateSettings" text="どこでも置けるモード"/>
		<div>
			<el-radio v-model="game.settings.bw" label="random" @change="updateSettings">ランダム</el-radio>
			<el-radio v-model="game.settings.bw" :label="1" @change="updateSettings">{{ game.user1.name }}が黒</el-radio>
			<el-radio v-model="game.settings.bw" :label="2" @change="updateSettings">{{ game.user2.name }}が黒</el-radio>
		</div>
	</div>

	<footer>
		<p class="status">
			<template v-if="isAccepted && isOpAccepted">ゲームは数秒後に開始されます<mk-ellipsis/></template>
			<template v-if="isAccepted && !isOpAccepted">相手の準備が完了するのを待っています<mk-ellipsis/></template>
			<template v-if="!isAccepted && isOpAccepted">あなたの準備が完了するのを待っています</template>
			<template v-if="!isAccepted && !isOpAccepted">準備中<mk-ellipsis/></template>
		</p>

		<div class="actions">
			<el-button @click="exit">キャンセル</el-button>
			<el-button type="primary" @click="accept" v-if="!isAccepted">準備完了</el-button>
			<el-button type="primary" @click="cancel" v-if="isAccepted">準備続行</el-button>
		</div>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as maps from '../../../../../common/othello/maps';

export default Vue.extend({
	props: ['game', 'connection'],

	data() {
		return {
			o: null,
			isLlotheo: false,
			mapName: maps.eighteight.name,
			maps: maps
		};
	},

	computed: {
		mapCategories(): string[] {
			const categories = Object.entries(maps).map(x => x[1].category);
			return categories.filter((item, pos) => categories.indexOf(item) == pos);
		},
		isAccepted(): boolean {
			if (this.game.user1_id == (this as any).os.i.id && this.game.user1_accepted) return true;
			if (this.game.user2_id == (this as any).os.i.id && this.game.user2_accepted) return true;
			return false;
		},
		isOpAccepted(): boolean {
			if (this.game.user1_id != (this as any).os.i.id && this.game.user1_accepted) return true;
			if (this.game.user2_id != (this as any).os.i.id && this.game.user2_accepted) return true;
			return false;
		}
	},

	created() {
		this.connection.on('change-accepts', this.onChangeAccepts);
		this.connection.on('update-settings', this.onUpdateSettings);
	},

	beforeDestroy() {
		this.connection.off('change-accepts', this.onChangeAccepts);
		this.connection.off('update-settings', this.onUpdateSettings);
	},

	methods: {
		exit() {

		},

		accept() {
			this.connection.send({
				type: 'accept'
			});
		},

		cancel() {
			this.connection.send({
				type: 'cancel-accept'
			});
		},

		onChangeAccepts(accepts) {
			this.game.user1_accepted = accepts.user1;
			this.game.user2_accepted = accepts.user2;
			this.$forceUpdate();
		},

		updateSettings() {
			this.connection.send({
				type: 'update-settings',
				settings: this.game.settings
			});
		},

		onUpdateSettings(settings) {
			this.game.settings = settings;
			if (this.game.settings.map == null) {
				this.mapName = null;
			} else {
				const foundMap = Object.entries(maps).find(x => x[1].data.join('') == this.game.settings.map.join(''));
				this.mapName = foundMap ? foundMap[1].name : '-Custom-';
			}
		},

		onMapChange(v) {
			if (v == null) {
				this.game.settings.map = null;
			} else {
				this.game.settings.map = Object.entries(maps).find(x => x[1].name == v)[1].data;
			}
			this.$forceUpdate();
			this.updateSettings();
		},

		onPixelClick(pos, pixel) {
			const x = pos % this.game.settings.map[0].length;
			const y = Math.floor(pos / this.game.settings.map[0].length);
			const newPixel =
				pixel == ' ' ? '-' :
				pixel == '-' ? 'b' :
				pixel == 'b' ? 'w' :
				' ';
			const line = this.game.settings.map[y].split('');
			line[x] = newPixel;
			this.$set(this.game.settings.map, y, line.join(''));
			this.$forceUpdate();
			this.updateSettings();
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.root
	text-align center

	> header
		padding 8px
		border-bottom dashed 1px #c4cdd4

	> .map
		width 300px

	> .board
		display grid
		grid-gap 4px
		width 300px
		height 300px
		margin 16px auto

		> div
			background transparent
			border solid 2px #ddd
			border-radius 6px
			overflow hidden
			cursor pointer

			*
				pointer-events none
				user-select none
				width 100%
				height 100%

			&.none
				border-color transparent

	> .rules
		max-width 300px
		margin 0 auto 32px auto

	> footer
		position sticky
		bottom 0
		padding 16px
		background rgba(255, 255, 255, 0.9)
		border-top solid 1px #c4cdd4

		> .status
			margin 0 0 16px 0
</style>
