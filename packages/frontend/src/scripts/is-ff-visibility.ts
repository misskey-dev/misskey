export function isFfVisibility(id, user):boolean {
	if (id === user.id) {
		return true;
	}

	switch (user.ffVisibility) {
		case 'private': 
			return false;
		case 'followers':
			if (!user.isFollowing) {
				return false;
			}
			// fallthrough
		default: return true;
	}
}
