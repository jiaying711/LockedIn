// input validation utility functions
function validateStringField(field, name, min = 3, max = 50) {
    if (typeof field !== 'string' || field.trim().length < min || field.trim().length > max) {
        return `${name} must be a string between ${min}-${max} characters`;
    }
    return null;
}

function validateEmail(email) {
    if (typeof email !== 'string') return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
}

function validateFields(fields) {
    return (req, res, next) => {
        for (const { field, name, min, max } of fields) {
            const error = validateStringField(req.body[field], name, min, max);
            console.log(error);
            if (error) return res.status(400).json({ error });
        }
        if (req.body.email && !validateEmail(req.body.email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        next();
    };
}

module.exports = {
    validateStringField,
    validateEmail,
    validateFields
};
