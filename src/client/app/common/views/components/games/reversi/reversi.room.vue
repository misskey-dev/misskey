<template>
<div class="root">
	<header><b>{{ game.user1 | userName }}</b> vs <b>{{ game.user2 | userName }}</b></header>

	<div>
		<p>%i18n:@settings-of-the-game%</p>

		<el-card class="map">
			<div slot="header">
				<el-select :class="$style.mapSelect" v-model="mapName" placeholder="%i18n:@choose-map%" @change="onMapChange">
					<el-option label="%i18n:@random%" :value="null"/>
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
				<span>%i18n:@black-or-white%</span>
			</div>
			<el-radio v-model="game.settings.bw" label="random" @change="updateSettings">%i18n:@random%</el-radio>
			<el-radio v-model="game.settings.bw" :label="1" @change="updateSettings">{{ '%i18n:@black-is%'.split('{}')[0] }}{{ game.user1.name }}{{ '%i18n:@black-is%'.split('{}')[1] }}</el-radio>
			<el-radio v-model="game.settings.bw" :label="2" @change="updateSettings">{{ '%i18n:@black-is%'.split('{}')[0] }}{{ game.user2.name }}{{ '%i18n:@black-is%'.split('{}')[1] }}</el-radio>
		</el-card>

		<el-card class="rules">
			<div slot="header">
				<span>%i18n:@rules%</span>
			</div>
			<mk-switch v-model="game.settings.isLlotheo" @change="updateSettings" text="%i18n:@is-llotheo%"/>
			<mk-switch v-model="game.settings.loopedBoard" @change="updateSettings" text="%i18n:@looped-map%"/>
			<mk-switch v-model="game.settings.canPutEverywhere" @change="updateSettings" text="%i18n:@can-put-everywhere%"/>
		</el-card>

		<el-card class="bot-form" v-if="form">
			<div slot="header">
				<span>%i18n:@settings-of-the-bot%</span>
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
			<template v-if="isAccepted && isOpAccepted">%i18n:@this-gane-is-started-soon%<mk-ellipsis/></template>
			<template v-if="isAccepted && !isOpAccepted">%i18n:@waiting-for-other%<mk-ellipsis/></template>
			<template v-if="!isAccepted && isOpAccepted">%i18n:@waiting-for-me%</template>
			<template v-if="!isAccepted && !isOpAccepted">%i18n:@waiting-for-both%<mk-ellipsis/></template>
		</p>

		<div class="actions">
			<el-button @click="exit">%i18n:@cancel%</el-button>
			<el-button type="primary" @click="accept" v-if="!isAccepted">%i18n:@ready%</el-button>
			<el-button type="primary" @click="cancel" v-if="isAccepted">%i18n:@cancel-ready%</el-button>
		</div>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as maps from '../../../../../../../games/reversi/maps';

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
			const categories = Object.values(maps).map(x => x.category);
			return categories.filter((item, pos) => categories.indexOf(item) == pos);
		},
		isAccepted(): boolean {
			if (this.game.user1Id == this.$store.state.i.id && this.game.user1Accepted) return true;
			if (this.game.user2Id == this.$store.state.i.id && this.game.user2Accepted) return true;
			return false;
		},
		isOpAccepted(): boolean {
			if (this.game.user1Id != this.$store.state.i.id && this.game.user1Accepted) return true;
			if (this.game.user2Id != this.$store.state.i.id && this.game.user2Accepted) return true;
			return false;
		}
	},

	created() {
		this.connection.on('change-accepts', this.onChangeAccepts);
		this.connection.on('update-settings', this.onUpdateSettings);
		this.connection.on('init-form', this.onInitForm);
		this.connection.on('message', this.onMessage);

		if (this.game.user1Id != this.$store.state.i.id && this.game.settings.form1) this.form = this.game.settings.form1;
		if (this.game.user2Id != this.$store.state.i.id && this.game.settings.form2) this.form = this.game.settings.form2;
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
			this.game.user1Accepted = accepts.user1;
			this.game.user2Accepted = accepts.user2;
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
				const found = Object.values(maps).find(x => x.data.join('') == this.game.settings.map.join(''));
				this.mapName = found ? found.name : '-Custom-';
			}
		},

		onInitForm(x) {
			if (x.userId == this.$store.state.i.id) return;
			this.form = x.form;
		},

		onMessage(x) {
			if (x.userId == this.$store.state.i.id) return;
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
				this.game.settings.map = Object.values(maps).find(x => x.name == v).data;
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
