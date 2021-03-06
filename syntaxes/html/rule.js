var is = require('is');

var markup = require('../../');
var identity = require('../../lib/utils/identity');

var SINGLE_TAG = ['img', 'hr'];

/**
    Convert a map of attributes into a string

    @param {Object} attrs
    @return {String}
*/
function attrsToString(attrs) {
    var output = '', value;

    for (var key in attrs) {
        value = attrs[key];
        if (is.undefined(value) || is.null(value)) {
            continue;
        }

        if (is.string(value) && !value) {
            output += ' ' + key;
        } else {
            output += ' ' + key + '=' + JSON.stringify(value);
        }


    }

    return output;
}

function HTMLRule(type, tag, getAttrs) {
    getAttrs = getAttrs || identity;
    var isSingleTag = SINGLE_TAG.indexOf(tag) >= 0;

    return markup.Rule(type)
        .toText(function(text, token) {
            var attrs = getAttrs(token.data, token);
            var output = '<' + tag + attrsToString(attrs) + (isSingleTag? '/>' : '>');

            if (!isSingleTag) {
                output += text;
                output += '</' + tag + '>';
            }

            return output;
        });
}

module.exports = HTMLRule;
