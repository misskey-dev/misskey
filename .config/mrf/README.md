# MRF
Inspired by Pleroma's Message Rewrite Facility,
.JS files placed here allow you to filter incoming Activities from external instances.

Each module should export only a function that takes one object as a parameter, with an incoming activity as a property.

For example:
```js
module.exports = function(data) {
    if (data.activity) return false;
}
```

This extremely simple module will simply reject any incoming activities.
Returning anything other than `false` will continue to the next MRF policy.
