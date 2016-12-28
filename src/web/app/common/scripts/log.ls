riot = require \riot

logs = []

ev = riot.observable!

function log(msg)
	logs.push do
		date: new Date!
		message: msg
	ev.trigger \log

riot.mixin \log do
	logs: logs
	log: log
	log-event: ev

module.exports = log
