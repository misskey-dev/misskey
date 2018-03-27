db.users.update({ }, { $set: { host: null } }, { multi: true });
