'use strict'

const fs = require('fs')
const filename = process.argv[2] || 'package.json'

fs.readFile(filename, (err, data) => {
    if (err) process.exit(2)
    const object = JSON.parse(data)
    delete object.devDependencies
    fs.writeFile(filename, JSON.stringify(object, null, 4) + '\n', err => {
        if (err) process.exit(3)
    })
})
