"use strict";

var utils = module.exports = {};

utils.getOption = getOption;

function getOption(options, name, defaultValue) {
    var value = options[name];

    if ((value === undefined || value === null) && defaultValue !== undefined) {
        return defaultValue;
    }

    return value;
}

/**
 * Loops through the collection and calls the callback for each element. if the callback returns truthy, the loop is broken and returns the same value.
 * @public
 * @param {*} collection The collection to loop through. Needs to have a length property set and have indices set from 0 to length - 1.
 * @param {function} callback The callback to be called for each element. The element will be given as a parameter to the callback. If this callback returns truthy, the loop is broken and the same value is returned.
 * @returns {*} The value that a callback has returned (if truthy). Otherwise nothing.
 */
utils.forEach = function (collection, callback) {
    for (var i = 0; i < collection.length; i++) {
        var result = callback(collection[i]);
        if (result) {
            return result;
        }
    }
};

utils.unique = function (collection, hashFunction) {
    var output = [];
    var sieveObject = {};
    utils.forEach(collection, function (element) {
        var hash = hashFunction(element);
        if (!sieveObject[hash]) {
            output.push(element);
            sieveObject[hash] = true;
        }
    });

    return output;
};
