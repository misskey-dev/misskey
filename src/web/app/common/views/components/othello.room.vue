<template>
<div class="root">
	<header><b>{{ game.user1.name }}</b> vs <b>{{ game.user2.name }}</b></header>

	<div>
		<p>ゲームの設定</p>

		<el-card class="map">
			<div slot="header">
				<el-select :class="$style.mapSelect" v-model="mapName" placeholder="マップを選択" @change="onMapChange">
					<el-option label="ランダム" :value="null"/>
					<el-option-group v-for="c in mapCategories" :key="c" :label="c">
						<el-option v-for="m in maps" v-if="m.category == c" :key="m.name" :label="m.name" :value="m.name">
							<span style="float: left">{{ m.name }}</span>
							<span style="float: right; color: #8492a6; font-size: 13px" v-if="m.author">(by <i>{{ m.author }}</i>)</span>
						</el-option>
					</el-option-group>
				</el-select>
			</div>
			<div :class="$style.board" v-if="game.settings.map != null" :style="{ 'grid-template-rows': `repeat(${ game.settings.map.length }, 1fr)`, 'grid-template-columns': `repeat(${ game.settings.map[0].length }, 1fr)` }">
				<div v-for="(x, i) in game.settings.map.join('')"
					:data-none="x == ' '"
					@click="onPixelClick(i, x)"
				>
					<template v-if="x == 'b'">%fa:circle%</template>
					<template v-if="x == 'w'">%fa:circle R%</template>
				</div>
			</div>
		</el-card>

		<el-card class="bw">
			<div slot="header">
				<span>先手/後手</span>
			</div>
			<el-radio v-model="game.settings.bw" label="random" @change="updateSettings">ランダム</el-radio>
			<el-radio v-model="game.settings.bw" :label="1" @change="updateSettings">{{ game.user1.name }}が黒</el-radio>
			<el-radio v-model="game.settings.bw" :label="2" @change="updateSettings">{{ game.user2.name }}が黒</el-radio>
		</el-card>

		<el-card class="rules">
			<div slot="header">
				<span>ルール</span>
			</div>
			<mk-switch v-model="game.settings.is_llotheo" @change="updateSettings" text="石の少ない方が勝ち(ロセオ)"/>
			<mk-switch v-model="game.settings.looped_board" @change="updateSettings" text="ループマップ"/>
			<mk-switch v-model="game.settings.can_put_everywhere" @change="updateSettings" text="どこでも置けるモード"/>
		</el-card>

		<el-card class="bot-form" v-if="form">
			<div slot="header">
				<span>Botの設定</span>
			</div>
			<el-alert v-for="message in messages"
				:title="message.text"
				:type="message.type"
				:key="message.id"
			/>
			<template v-for="item in form">
				<mk-switch v-if="item.type == 'button'" v-model="item.value" :key="item.id" :text="item.label" @change="onChangeForm($event, item)">{{ item.desc || '' }}</mk-switch>

				<el-card v-if="item.type == 'radio'" :key="item.id">
					<div slot="header">
						<span>{{ item.label }}</span>
					</div>
					<el-radio v-for="(r, i) in item.items" :key="item.id + ':' + i" v-model="item.value" :label="r.value" @change="onChangeForm($event, item)">{{ r.label }}</el-radio>
				</el-card>

				<el-card v-if="item.type == 'textbox'" :key="item.id">
					<div slot="header">
						<span>{{ item.label }}</span>
					</div>
					<el-input v-model="item.value" @change="onChangeForm($event, item)"/>
				</el-card>
			</template>
		</el-card>
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
			maps: maps,
			form: null,
			messages: []
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
		this.connection.on('init-form', this.onInitForm);
		this.connection.on('message', this.onMessage);

		if (this.game.user1_id != (this as any).os.i.id && this.game.settings.form1) this.form = this.game.settings.form1;
		if (this.game.user2_id != (this as any).os.i.id && this.game.settings.form2) this.form = this.game.settings.form2;

		// for debugging
		if ((this as any).os.i.username == 'test1') {
			setTimeout(() => {
				this.connection.send({
					type: 'init-form',
					body: [{
						id: 'button1',
						type: 'button',
						label: 'Enable hoge',
						value: false
					}, {
						id: 'radio1',
						type: 'radio',
						label: '強さ',
						value: 2,
						items: [{
							label: '弱',
							value: 1
						}, {
							label: '中',
							value: 2
						}, {
							label: '強',
							value: 3
						}]
					}]
				});

				this.connection.send({
					type: 'message',
					body: {
						text: 'Hey',
						type: 'info'
					}
				});
			}, 2000);
		}
	},

	beforeDestroy() {
		this.connection.off('change-accepts', this.onChangeAccepts);
		this.connection.off('update-settings', this.onUpdateSettings);
		this.connection.off('init-form', this.onInitForm);
		this.connection.off('message', this.onMessage);
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

		onInitForm(x) {
			if (x.user_id == (this as any).os.i.id) return;
			this.form = x.form;
		},

		onMessage(x) {
			if (x.user_id == (this as any).os.i.id) return;
			this.messages.unshift(x.message);
		},

		onChangeForm(v, item) {
			this.connection.send({
				type: 'update-form',
				id: item.id,
				value: v
			});
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
	background #f9f9f9

	> header
		padding 8px
		border-bottom dashed 1px #c4cdd4

	> div
		padding 0 16px

		> .map
		> .bw
		> .rules
		> .bot-form
			max-width 400px
			margin 0 auto 16px auto

	> footer
		position sticky
		bottom 0
		padding 16px
		background rgba(255, 255, 255, 0.9)
		border-top solid 1px #c4cdd4

		> .status
			margin 0 0 16px 0
</style>

<style lang="stylus" module>
.mapSelect
	width 100%

.board
	display grid
	grid-gap 4px
	width 300px
	height 300px
	margin 0 auto

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

		&[data-none]
			border-color transparent

</style>

<style lang="stylus">
.el-alert__content
	position initial !important
</style>
