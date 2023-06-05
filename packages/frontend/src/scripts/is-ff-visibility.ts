export function isFfVisibility(i, user):boolean {

	let checkFlag:boolean;

	switch (user.ffVisibility) {
		case 'private': 
			checkFlag = false;
			break;
		case 'followers':
			if (!user.isFollowing) {
				checkFlag = false;
				break;
			}
			// fallthrough
		default: checkFlag = true;
	}

	if (!i) {
		if (checkFlag) {
			return true;
		}
		return false;
	}

	//自分自身の場合は一律true
	if (i.id === user.id) {
		return true;
	}

	return checkFlag;

}
