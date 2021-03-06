'use strict';
var validator = require('./validator');
var boom = require("boom");

module.exports = function Validate(schema) {
    if (!(this instanceof Validate)) {
        return new Validate(schema);
    }
    var self = this;

    self._schemaToValidate = schema;
    self.schema = validateSchema;
    self.validate = validate;

    function validateSchema(req, res, next) {
        var result = validate(req.body);
        if (!result.valid) {
            return next(boom.badRequest("The data was not in the correct format. " + result.message, result.errors));
        }
        return next();
    }

    function validate(document) {
        return validator.validate(self._schemaToValidate, document);
    }
};