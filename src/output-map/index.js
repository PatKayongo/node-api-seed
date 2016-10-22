'use strict';
var validator = require('../validate/validator');
var jsonSchemaFilter = require('json-schema-filter');
var _ = require('lodash');
var ensureExistsOnReq = require('./ensure-exists-on-req');
var util = require('util');
var boom = require('boom');

module.exports = {
    init: init,
    setSchemas: setSchemas,
    validateCreation: validateCreation,
    validateUpdate: validateUpdate,
    filterOutput: filterOutput,
    mapOutput: mapOutput,
    set: set,
    setOutput: setOutput,
    ensureOutput: ensureOutput,
    ensureExistsOnReq: ensureExistsOnReq,
    sendOutput: function sendOutput(req, res) {
        return res.status(200).json(req.process.output);
    },
    newQuery: newQuery,
    addQueryStringToQuery: addQueryStringToQuery,
    sendNoContent: function (req, res) {
        res.status(204).send();
    }
};

function init(req, res, next) {
    req.process = {};
    next();
}

function setSchemas(schemas) {
    if (!_.isObject(schemas)) {
        throw new Error("Schemas must be an object when calling setSchemas");
    }
    if (schemas.creation.id === schemas.update.id) {
        validator.addSchema(schemas.creation);
    } else {
        validator.addSchema(schemas.creation);
        validator.addSchema(schemas.update);
    }
    return setSchemaMiddleware;
    function setSchemaMiddleware(req, res, next) {
        req.process.schemas = schemas;
        next();
    }
}

function validateCreation(req, res, next) {
    if (!req.process.schemas) {
        return next(new Error("req.process.schemas must be set"));
    }
    if (!req.process.schemas.creation) {
        return next(new Error("req.process.schemas.creation must be set"));
    }
    if (!req.process.schemas.creation.id) {
        return next(new Error(util.format("req.process.schemas.creation.id was null. Schema was %j ", req.process.schemas.creation)));
    }
    var result = validator.validate(req.process.schemas.creation.id, req.body);
    if (!result.valid) {
        return next(boom.badRequest(result.message, result.errors));
    }
    return next();
}

function validateUpdate(req, res, next) {
    if (!req.process.schemas) {
        return next(new Error("req.process.schemas must be set"));
    }
    if (!req.process.schemas.update) {
        return next(new Error("req.process.schemas.update must be set"));
    }
    if (!req.process.schemas.update.id) {
        return next(new Error(util.format("req.process.schemas.update.id was null. Schema was %j ", req.process.schemas.update)));
    }
    var result = validator.validate(req.process.schemas.update.id, req.body);
    if (!result.valid) {
        return next(boom.badRequest(result.message, result.errors));
    }
    return next();
}

function filterOutput(req, res, next) {
    if (!req.process.schemas.output) {
        return next(new Error("Schema must be set before you can call mapOutput"));
    }
    if (!req.process.output) {
        return next(new Error("req.process.output must be set before you can call mapOutput"));
    }
    if (_.isArray(req.process.output)) {
        req.process.output.forEach(function (item, index) {
            req.process.output[index] = jsonSchemaFilter(req.process.schemas.output, item);
        });
    } else {
        req.process.output = jsonSchemaFilter(req.process.schemas.output, req.process.output);
    }
    return next();
}

function mapOutput(map) {
    if (!map) {
        throw new Error('Map is required');
    }
    if (!_.isObject(map)) {
        throw new Error('Map must be an object');
    }
    return mappingMiddleware;
    function mappingMiddleware(req, res, next) {
        try {
            Object.keys(map).forEach(performMapping);
        }
        catch (err) {
            return next(err);
        }
        return next();
        function performMapping(key) {
            var mapping = map[key];
            if (_.isFunction(mapping)) {
                mapping(req, res, next);
                return;
            }
            if (_.isString(mapping)) {
                if (_.isArray(req.process.output)) {
                    req.process.output.forEach(function (outputItem) {
                        outputItem[key] = _.get(outputItem, mapping);
                    });
                    return;
                }
                if (_.isObject(req.process.output)) {
                    req.process.output[key] = _.get(req.process.output, mapping);
                    return;
                }
                throw new Error("req.process.output was not an array or object, unsure how to map, req.process.output : " + JSON.stringify(req.process.output) + ". Mapping : " + JSON.stringify(mapping));
            }
            throw new Error("Unknown mapping option : " + JSON.stringify(mapping));
        }
    }
}

function setOutput(path) {
    if (_.isNil(path)) {
        throw new Error("Path must be set when calling setOutput");
    }
    if (!_.isString(path)) {
        throw new Error("Path must be a string when calling setOutput");
    }
    return set('process.output', 'process.' + path);
}

function set(destinationPath, sourcePath) {
    if (!destinationPath || !_.isString(destinationPath)) {
        throw new Error("destinationPath must be a non empty string");
    }
    if (!sourcePath || !_.isString(sourcePath)) {
        throw new Error("sourcePath must be a non empty string");
    }
    return setMiddleware;
    function setMiddleware(req, res, next) {
        _.set(req, destinationPath, _.get(req, sourcePath));
        next();
    }
}

function ensureOutput(options) {
    return ensureExistsOnReq('process.output', options);
}

function newQuery(req, res, next) {
    req.process.query = {};
    next();
}

function addQueryStringToQuery(req, res, next) {
    req.process.query = _.merge({}, req.query, req.process.query);
    next();
}
