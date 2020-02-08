export function focusPrev(el: Element | null, self = false) {
	if (el == null) return;
	if (!self) el = el.previousElementSibling;
	if (el) {
		if (el.hasAttribute('tabindex')) {
			(el as HTMLElement).focus();
		} else {
			focusPrev(el.previousElementSibling, true);
		}
	}
}

export function focusNext(el: Element | null, self = false) {
	if (el == null) return;
	if (!self) el = el.nextElementSibling;
	if (el) {
		if (el.hasAttribute('tabindex')) {
			(el as HTMLElement).focus();
		} else {
			focusPrev(el.nextElementSibling, true);
		}
	}
}
