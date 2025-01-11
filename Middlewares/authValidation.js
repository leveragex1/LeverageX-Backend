const Joi = require('joi');

const signupValidation = (req, res, next) => {
    const schema = Joi.object({
        fullName: Joi.string().min(3).max(100).required(),
        email: Joi.string().email().required(),  // Added email validation
        mobile: Joi.string().pattern(new RegExp('^[0-9]{10}$')).required(),
        aadhaar: Joi.string().min(12).max(12).required(),
        pan: Joi.string().alphanum().length(10).required(),
        password: Joi.string().min(4).max(100).required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400)
            .json({ message: "Bad request", error });
    }
    next();
};

const loginValidation = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),  // Validate email in login
        password: Joi.string().min(4).max(100).required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400)
            .json({ message: "Bad request", error });
    }
    next();
};

module.exports = {
    signupValidation,
    loginValidation
};
