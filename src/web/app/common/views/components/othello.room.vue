<template>
<div class="root">
	<header><b>{{ game.user1.name }}</b> vs <b>{{ game.user2.name }}</b></header>

	<p>ゲームの設定</p>

	<el-select v-model="mapName" placeholder="マップを選択" @change="onMapChange">
		<el-option v-for="m in maps" :key="m.name" :label="m.name" :value="m.name"/>
	</el-select>

	<div class="board" :style="{ 'grid-template-rows': `repeat(${ game.settings.map.size }, 1fr)`, 'grid-template-columns': `repeat(${ game.settings.map.size }, 1fr)` }">
		<div v-for="(x, i) in game.settings.map.data"
			:class="{ none: x == ' ' }"
		>
			<template v-if="x == 'b'">%fa:circle%</template>
			<template v-if="x == 'w'">%fa:circle R%</template>
		</div>
	</div>

	<div class="rules">
		<mk-switch v-model="game.settings.is_llotheo" @change="onIsLlotheoChange" text="石の少ない方が勝ち(ロセオ)"/>
	</div>

	<div class="actions">
		<el-button @click="exit">キャンセル</el-button>
		<el-button type="primary" @click="accept" v-if="!isAccepted">準備完了</el-button>
		<el-button type="primary" @click="cancel" v-if="isAccepted">準備続行</el-button>
	</div>
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
		isAccepted(): boolean {
			if (this.game.user1_id == (this as any).os.i.id && this.game.user1_accepted) return true;
			if (this.game.user2_id == (this as any).os.i.id && this.game.user2_accepted) return true;
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

		onUpdateSettings(settings) {
			this.game.settings = settings;
			this.mapName = this.game.settings.map.name;
		},

		onMapChange(v) {
			this.game.settings.map = Object.entries(maps).find(x => x[1].name == v)[1];
			this.connection.send({
				type: 'update-settings',
				settings: this.game.settings
			});
			this.$forceUpdate();
		},

		onIsLlotheoChange(v) {
			this.connection.send({
				type: 'update-settings',
				settings: this.game.settings
			});
			this.$forceUpdate();
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

	> .board
		display grid
		grid-gap 4px
		width 300px
		height 300px
		margin 16px auto

		> div
			background transparent
			border solid 2px #eee
			border-radius 6px
			overflow hidden

			*
				pointer-events none
				user-select none
				width 100%
				height 100%

			&.none
				border-color transparent

	> .rules
		max-width 300px
		margin 0 auto

	> .actions
		margin-bottom 16px
</style>
