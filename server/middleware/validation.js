const { body, validationResult } = require('express-validator');

exports.validateProject = [
    body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
    body('description').trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
    body('budget').isFloat({ gt: 0 }).withMessage('Budget must be a positive number'),
    body('deadline').isDate().withMessage('Invalid deadline date'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

exports.validateProfile = [
    body('bio').optional().trim().isLength({ max: 500 }),
    body('location').optional().trim().isLength({ max: 100 }),
    body('hourly_rate').optional().isFloat({ min: 0 }),
    body('experience').optional().isInt({ min: 0 })
];