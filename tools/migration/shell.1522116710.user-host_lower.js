db.users.update({ }, { $set: { host_lower: null } }, { multi: true });
