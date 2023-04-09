import { char2twemojiFilePath } from '@/scripts/emoji-base';

const char2path = char2twemojiFilePath;

const remoteCustomEmojiEl = document.getElementById("remote_custom_emojis");
let remoteCustomEmojis: { name: string; url: string; host?: string; }[] = [];
if (remoteCustomEmojiEl) {
    remoteCustomEmojis = JSON.parse(remoteCustomEmojiEl.innerHTML);
}

function getCustomEmojiName(ceNameRaw: string) {
    return (ceNameRaw.startsWith(":") ? ceNameRaw.substr(1, ceNameRaw.length - 2) : ceNameRaw).replace('@.', '');
}

function getCustomEmojiUrl(ceName: string) {
    const remote = remoteCustomEmojis.find((emoji) => emoji.name === ceName);
    if (remote) {
        return remote.url;
    }
	return `/emoji/${ceName}.webp`;
}

export function parseEmoji() {
    document.querySelectorAll(".emoji").forEach((el) => {
        let src: (string | null) = null;
        if (el.innerHTML.startsWith(":")) {
            console.log(getCustomEmojiName(el.innerHTML));
            src = getCustomEmojiUrl(getCustomEmojiName(el.innerHTML));
        } else {
            src = char2path(el.innerHTML);
        }
        if (src) {
            const emojiEl = document.createElement("img");
            emojiEl.src = src;
            emojiEl.title = getCustomEmojiName(el.innerHTML);
            el.innerHTML = emojiEl.outerHTML;
        }
    });
}
