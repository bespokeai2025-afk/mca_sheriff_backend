// import { body, param } from "express-validator";

// export const validateAdmin = [
//     body("mobile")
//         .optional()
//         .isString()
//         .matches(/^[6-9]\d{9}$/)
//         .withMessage("Mobile number must be 10 digits and start with 6-9.")
//         .trim()
//         .escape(),

//     body("name")
//         .optional()
//         .isString()
//         .matches(/^[A-Za-z\s]+$/)
//         .withMessage("Name must only contain alphabets and spaces.")
//         .trim()
//         .escape(),

//     body("email")
//         .optional()
//         .isEmail().withMessage('Invalid email format')
//         .normalizeEmail()
//         .trim()
//         .escape(),


// ]

// export const validateUserID = [

//     param("id")
//         .notEmpty().withMessage("User ID cannot be empty.")
//         .isUUID().withMessage("Invalid user ID")
//         .trim()
//         .escape()
// ]



import { body, param } from "express-validator";

// Regex for strong password: 
// Minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
export const validateAdmin = [
   body("mobile")
        .optional()
        .isString()
        .matches(/^(\+?\d{1,3}[- ]?)?\d{7,15}$/)
        .withMessage("Please enter a valid mobile number with optional country code.")
        .trim()
        .escape(),

    body("name")
        .optional()
        .isString()
        .matches(/^[A-Za-z\s]+$/)
        .withMessage("Name must only contain alphabets and spaces.")
        .trim()
        .escape(),

    body("lastName")
        .optional()
        .isString()
        .matches(/^[A-Za-z\s]+$/)
        .withMessage("Last name must only contain alphabets and spaces.")
        .trim()
        .escape(),

    body("organization")
        .optional()
        .isString()
        .matches(/^[A-Za-z\s]+$/)
        .withMessage("Organization name must only contain alphabets and spaces.")
        .trim()        
        .escape(),

    body("email")
        .optional()
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail()
        .trim()
        .escape(),

    body("password")
        .optional()
        .isString()
        .matches(strongPasswordRegex)
        .withMessage("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.")
        .trim(),
];

export const validateUserID = [
    param("id")
        .notEmpty()
        .withMessage("User ID cannot be empty.")
        .isUUID()
        .withMessage("Invalid user ID")
        .trim()
        .escape()
];
