'use strict';
var _ = require('lodash');
var os = require('os');
const eol = os.EOL;
const checkTypes = ['truthy', 'falsy', 'nil', 'notNil', 'not-nil'];
module.exports = {
    ensureExactly1Key: ensureExactly1Key,
    ensureAllKeys: ensureAllKeys
};

function validate(object, paths, checkType, methodName) {
    if (!_.isObject(object)) {
        throw new Error("Object must be an object when calling " + methodName);
    }
    if (!_.isArray(paths)) {
        throw new Error("Keys must be an array when calling " + methodName);
    }
    if (paths.length < 1) {
        throw new Error("At least one key must be supplied when calling " + methodName);
    }
    if (!_.isString(checkType) || checkTypes.indexOf(checkType) < 0) {
        throw new Error("checkType must be one of the following strings " + JSON.stringify(checkTypes) + " when calling " + methodName);
    }
}

function ensureExactly1Key(object, paths, checkType) {
    validate(object, paths, checkType, 'ensureExactly1KeyTruthy');
    var found = false;
    paths.forEach(function (path) {
        let value = _.get(object, path);
        if (!valueValid(value, checkType)) {
            return;
        }
        if (found) {
            throw new Error("Object should only have one of the following paths being truthy : "
                + JSON.stringify(paths) + eol + "The object was : " + JSON.stringify(object, null, 4));
        }
        found = true;
    });
    if (!found) {
        throw new Error("Object should have exactly one of the following paths being truthy : "
            + JSON.stringify(paths) + eol + "The object had none and was : " + JSON.stringify(object, null, 4));
    }
}

function ensureAllKeys(object, paths, checkType) {
    validate(object, paths, checkType, 'ensureAllKeysTruthy');
    paths.forEach(function (path) {
        let value = _.get(object, path);
        if (!valueValid(value, checkType)) {
            throw new Error("Object should only have all of the following paths being truthy : "
                + JSON.stringify(paths) + eol + "The object was : " + JSON.stringify(object, null, 4));
        }
    });
}

function valueValid(value, checkType) {
    if (checkType === 'truthy') {
        return Boolean(value);
    }
    if (checkType === 'falsy') {
        //eslint-disable-next-line no-extra-boolean-cast
        return !Boolean(value);
    }
    if (checkType === 'nil') {
        return _.isNil(value);
    }
    if (checkType === 'notNil' || checkType === 'not-nil') {
        return !_.isNil(value);
    }
    throw new Error('Invalid check type : ' + checkType);
}