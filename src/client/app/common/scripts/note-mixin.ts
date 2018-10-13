import parse from '../../../../mfm/parse';
import { sum } from '../../../../prelude/array';
import MkNoteMenu from '../views/components/note-menu.vue';
import MkReactionPicker from '../views/components/reaction-picker.vue';
import Ok from '../views/components/ok.vue';

function focus(el, fn) {
	const target = fn(el);
	if (target) {
		if (target.hasAttribute('tabindex')) {
			target.focus();
		} else {
			focus(target, fn);
		}
	}
}

type Opts = {
	mobile?: boolean;
};

export default (opts: Opts = {}) => ({
	data() {
		return {
			showContent: false
		};
	},

	computed: {
		keymap(): any {
			return {
				'r|left': () => this.reply(true),
				'e|a|plus': () => this.react(true),
				'q|right': () => this.renote(true),
				'f|b': this.favorite,
				'delete|ctrl+d': this.del,
				'ctrl+q|ctrl+right': this.renoteDirectly,
				'up|k|shift+tab': this.focusBefore,
				'down|j|tab': this.focusAfter,
				'esc': this.blur,
				'm|o': () => this.menu(true),
				's': this.toggleShowContent,
				'1': () => this.reactDirectly('like'),
				'2': () => this.reactDirectly('love'),
				'3': () => this.reactDirectly('laugh'),
				'4': () => this.reactDirectly('hmm'),
				'5': () => this.reactDirectly('surprise'),
				'6': () => this.reactDirectly('congrats'),
				'7': () => this.reactDirectly('angry'),
				'8': () => this.reactDirectly('confused'),
				'9': () => this.reactDirectly('rip'),
				'0': () => this.reactDirectly('pudding'),
			};
		},

		isRenote(): boolean {
			return (this.note.renote &&
				this.note.text == null &&
				this.note.fileIds.length == 0 &&
				this.note.poll == null);
		},

		appearNote(): any {
			return this.isRenote ? this.note.renote : this.note;
		},

		reactionsCount(): number {
			return this.appearNote.reactionCounts
				? sum(Object.values(this.appearNote.reactionCounts))
				: 0;
		},

		title(): string {
			return new Date(this.appearNote.createdAt).toLocaleString();
		},

		urls(): string[] {
			if (this.appearNote.text) {
				const ast = parse(this.appearNote.text);
				return ast
					.filter(t => (t.type == 'url' || t.type == 'link') && !t.silent)
					.map(t => t.url);
			} else {
				return null;
			}
		}
	},

	methods: {
		reply(viaKeyboard = false) {
			(this as any).apis.post({
				reply: this.appearNote,
				animation: !viaKeyboard,
				cb: () => {
					this.focus();
				}
			});
		},

		renote(viaKeyboard = false) {
			(this as any).apis.post({
				renote: this.appearNote,
				animation: !viaKeyboard,
				cb: () => {
					this.focus();
				}
			});
		},

		renoteDirectly() {
			(this as any).api('notes/create', {
				renoteId: this.appearNote.id
			});
		},

		react(viaKeyboard = false) {
			this.blur();
			(this as any).os.new(MkReactionPicker, {
				source: this.$refs.reactButton,
				note: this.appearNote,
				showFocus: viaKeyboard,
				animation: !viaKeyboard,
				compact: opts.mobile,
				big: opts.mobile
			}).$once('closed', this.focus);
		},

		reactDirectly(reaction) {
			(this as any).api('notes/reactions/create', {
				noteId: this.appearNote.id,
				reaction: reaction
			});
		},

		favorite() {
			(this as any).api('notes/favorites/create', {
				noteId: this.appearNote.id
			}).then(() => {
				(this as any).os.new(Ok);
			});
		},

		del() {
			(this as any).api('notes/delete', {
				noteId: this.appearNote.id
			});
		},

		menu(viaKeyboard = false) {
			(this as any).os.new(MkNoteMenu, {
				source: this.$refs.menuButton,
				note: this.appearNote,
				animation: !viaKeyboard,
				compact: opts.mobile,
			}).$once('closed', this.focus);
		},

		toggleShowContent() {
			this.showContent = !this.showContent;
		},

		focus() {
			this.$el.focus();
		},

		blur() {
			this.$el.blur();
		},

		focusBefore() {
			focus(this.$el, e => e.previousElementSibling);
		},

		focusAfter() {
			focus(this.$el, e => e.nextElementSibling);
		}
	}
});
