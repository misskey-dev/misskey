import { Directive } from 'vue';
import * as getCaretCoordinates from 'textarea-caret';
import { toASCII } from 'punycode';

export default {
	mounted(el, binding, vn) {
		const self = el._autoCompleteDirective_ = {} as any;
		self.x = new Autocomplete(el, vn.context, binding.value);
		self.x.attach();
	},

	unmounted(el, binding, vn) {
		const self = el._autoCompleteDirective_;
		self.x.detach();
	}
} as Directive;

/**
 * オートコンプリートを管理するクラス。
 */
class Autocomplete {
	private suggestion: any;
	private textarea: any;
	private vm: any;
	private currentType: string;
	private opts: {
		model: string;
	};
	private opening: boolean;

	private get text(): string {
		return this.vm[this.opts.model];
	}

	private set text(text: string) {
		this.vm[this.opts.model] = text;
	}

	/**
	 * 対象のテキストエリアを与えてインスタンスを初期化します。
	 */
	constructor(textarea, vm, opts) {
		//#region BIND
		this.onInput = this.onInput.bind(this);
		this.complete = this.complete.bind(this);
		this.close = this.close.bind(this);
		//#endregion

		this.suggestion = null;
		this.textarea = textarea;
		this.vm = vm;
		this.opts = opts;
		this.opening = false;
	}

	/**
	 * このインスタンスにあるテキストエリアの入力のキャプチャを開始します。
	 */
	public attach() {
		this.textarea.addEventListener('input', this.onInput);
	}

	/**
	 * このインスタンスにあるテキストエリアの入力のキャプチャを解除します。
	 */
	public detach() {
		this.textarea.removeEventListener('input', this.onInput);
		this.close();
	}

	/**
	 * テキスト入力時
	 */
	private onInput() {
		const caretPos = this.textarea.selectionStart;
		const text = this.text.substr(0, caretPos).split('\n').pop();

		const mentionIndex = text.lastIndexOf('@');
		const hashtagIndex = text.lastIndexOf('#');
		const emojiIndex = text.lastIndexOf(':');

		const max = Math.max(
			mentionIndex,
			hashtagIndex,
			emojiIndex);

		if (max == -1) {
			this.close();
			return;
		}

		const isMention = mentionIndex != -1;
		const isHashtag = hashtagIndex != -1;
		const isEmoji = emojiIndex != -1;

		let opened = false;

		if (isMention) {
			const username = text.substr(mentionIndex + 1);
			if (username != '' && username.match(/^[a-zA-Z0-9_]+$/)) {
				this.open('user', username);
				opened = true;
			} else if (username === '') {
				this.open('user', null);
				opened = true;
			}
		}

		if (isHashtag && !opened) {
			const hashtag = text.substr(hashtagIndex + 1);
			if (!hashtag.includes(' ')) {
				this.open('hashtag', hashtag);
				opened = true;
			}
		}

		if (isEmoji && !opened) {
			const emoji = text.substr(emojiIndex + 1);
			if (!emoji.includes(' ')) {
				this.open('emoji', emoji);
				opened = true;
			}
		}

		if (!opened) {
			this.close();
		}
	}

	/**
	 * サジェストを提示します。
	 */
	private async open(type: string, q: string) {
		if (type != this.currentType) {
			this.close();
		}
		if (this.opening) return;
		this.opening = true;
		this.currentType = type;

		//#region サジェストを表示すべき位置を計算
		const caretPosition = getCaretCoordinates(this.textarea, this.textarea.selectionStart);

		const rect = this.textarea.getBoundingClientRect();

		const x = rect.left + caretPosition.left - this.textarea.scrollLeft;
		const y = rect.top + caretPosition.top - this.textarea.scrollTop;
		//#endregion

		if (this.suggestion) {
			// TODO: Vueの警告が出るのでなんとかする
			this.suggestion.x = x;
			this.suggestion.y = y;
			this.suggestion.q = q;

			this.opening = false;
		} else {
			const MkAutocomplete = await import('../components/autocomplete.vue').then(m => m.default);

			// サジェスト要素作成
			this.suggestion = new MkAutocomplete({
				parent: this.vm,
				propsData: {
					textarea: this.textarea,
					complete: this.complete,
					close: this.close,
					type: type,
					q: q,
					x,
					y
				}
			}).$mount();

			// 要素追加
			document.body.appendChild(this.suggestion.$el);

			this.opening = false;
		}
	}

	/**
	 * サジェストを閉じます。
	 */
	private close() {
		if (this.suggestion == null) return;

		this.suggestion.destroyDom();
		this.suggestion = null;

		this.textarea.focus();
	}

	/**
	 * オートコンプリートする
	 */
	private complete(type, value) {
		this.close();

		const caret = this.textarea.selectionStart;

		if (type == 'user') {
			const source = this.text;

			const before = source.substr(0, caret);
			const trimmedBefore = before.substring(0, before.lastIndexOf('@'));
			const after = source.substr(caret);

			const acct = value.host === null ? value.username : `${value.username}@${toASCII(value.host)}`;

			// 挿入
			this.text = `${trimmedBefore}@${acct} ${after}`;

			// キャレットを戻す
			this.vm.$nextTick(() => {
				this.textarea.focus();
				const pos = trimmedBefore.length + (acct.length + 2);
				this.textarea.setSelectionRange(pos, pos);
			});
		} else if (type == 'hashtag') {
			const source = this.text;

			const before = source.substr(0, caret);
			const trimmedBefore = before.substring(0, before.lastIndexOf('#'));
			const after = source.substr(caret);

			// 挿入
			this.text = `${trimmedBefore}#${value} ${after}`;

			// キャレットを戻す
			this.vm.$nextTick(() => {
				this.textarea.focus();
				const pos = trimmedBefore.length + (value.length + 2);
				this.textarea.setSelectionRange(pos, pos);
			});
		} else if (type == 'emoji') {
			const source = this.text;

			const before = source.substr(0, caret);
			const trimmedBefore = before.substring(0, before.lastIndexOf(':'));
			const after = source.substr(caret);

			// 挿入
			this.text = trimmedBefore + value + after;

			// キャレットを戻す
			this.vm.$nextTick(() => {
				this.textarea.focus();
				const pos = trimmedBefore.length + value.length;
				this.textarea.setSelectionRange(pos, pos);
			});
		}
	}
}
