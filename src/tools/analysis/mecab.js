// Original source code: https://github.com/hecomi/node-mecab-async
// CUSTOMIZED BY SYUILO

var exec     = require('child_process').exec;
var execSync = require('child_process').execSync;
var sq       = require('shell-quote');

const config = require('../../conf').default;

// for backward compatibility
var MeCab = function() {};

MeCab.prototype = {
    command : config.analysis.mecab_command ? config.analysis.mecab_command : 'mecab',
    _format: function(arrayResult) {
        var result = [];
        if (!arrayResult) { return result; }
        // Reference: http://mecab.googlecode.com/svn/trunk/mecab/doc/index.html
        // 表層形\t品詞,品詞細分類1,品詞細分類2,品詞細分類3,活用形,活用型,原形,読み,発音
        arrayResult.forEach(function(parsed) {
            if (parsed.length <= 8) { return; }
            result.push({
                kanji         : parsed[0],
                lexical       : parsed[1],
                compound      : parsed[2],
                compound2     : parsed[3],
                compound3     : parsed[4],
                conjugation   : parsed[5],
                inflection    : parsed[6],
                original      : parsed[7],
                reading       : parsed[8],
                pronunciation : parsed[9] || ''
            });
        });
        return result;
    },
    _shellCommand : function(str) {
        return sq.quote(['echo', str]) + ' | ' + this.command;
    },
    _parseMeCabResult : function(result) {
        return result.split('\n').map(function(line) {
            return line.replace('\t', ',').split(',');
        });
    },
    parse : function(str, callback) {
        process.nextTick(function() { // for bug
            exec(MeCab._shellCommand(str), function(err, result) {
                if (err) { return callback(err); }
                callback(err, MeCab._parseMeCabResult(result).slice(0,-2));
            });
        });
    },
    parseSync : function(str) {
        var result = execSync(MeCab._shellCommand(str));
        return MeCab._parseMeCabResult(String(result)).slice(0, -2);
    },
    parseFormat : function(str, callback) {
        MeCab.parse(str, function(err, result) {
            if (err) { return callback(err); }
            callback(err, MeCab._format(result));
        });
    },
    parseSyncFormat : function(str) {
        return MeCab._format(MeCab.parseSync(str));
    },
    _wakatsu : function(arr) {
        return arr.map(function(data) { return data[0]; });
    },
    wakachi : function(str, callback) {
        MeCab.parse(str, function(err, arr) {
            if (err) { return callback(err); }
            callback(null, MeCab._wakatsu(arr));
        });
    },
    wakachiSync : function(str) {
        var arr = MeCab.parseSync(str);
        return MeCab._wakatsu(arr);
    }
};

for (var x in MeCab.prototype) {
    MeCab[x] = MeCab.prototype[x];
}

module.exports = MeCab;
