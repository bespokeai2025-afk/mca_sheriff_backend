import { body, param } from "express-validator";

export const validateEvent = [
    body("title")
        .notEmpty().withMessage("Title cannot be empty.")
        .isString().withMessage("Title must be a string."),

    body("event_type_id")
        .notEmpty().withMessage("Event type is required.")
        .isString().withMessage("Event type ID must be a string.")
        .isLength({ min: 36, max: 36 }).withMessage("Invalid event type ID format."),

    body("speaker")
        .notEmpty().withMessage("Speaker cannot be empty.")
        .isString().withMessage("Speaker must be a string."),

    body("speaker_details")
        .optional()
        .isString().withMessage("Speaker details must be a string."),

    body("from_date")
        .notEmpty().withMessage("From date is required.")
        .isISO8601().withMessage("Invalid date format (YYYY-MM-DD)."),

    body("to_date")
        .notEmpty().withMessage("To date is required.")
        .isISO8601().withMessage("Invalid date format (YYYY-MM-DD)."),

    body("from_time")
        .notEmpty().withMessage("From time is required.")
        .matches(/^\d{2}:\d{2}:\d{2}$/).withMessage("Invalid time format (HH:MM:SS)."),

    body("to_time")
        .notEmpty().withMessage("To time is required.")
        .matches(/^\d{2}:\d{2}:\d{2}$/).withMessage("Invalid time format (HH:MM:SS)."),

    body("paid_or_free")
        .notEmpty().withMessage("This field is required.")
        .isString().withMessage("Must be a string."),

    body("reward_id_for_attendees")
        .optional()
        .isString().withMessage("Reward ID must be a string."),

    body("description")
        .notEmpty().withMessage("Description cannot be empty.")
        .isString().withMessage("Description must be a string."),

    body("what_you_will_learn")
        .optional()
        .notEmpty().withMessage("This field cannot be empty.")
        .isString().withMessage("Must be a string."),

    body("location")
        .optional()
        .isString().withMessage("Location must be a string."),

    body("latitude")
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90."),

    body("longitude")
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180."),

    body("google_map_link")
        .optional()
        .isURL().withMessage("Invalid URL format for Google Maps link."),

    body("other_optional")
        .optional()
        .isObject().withMessage("Must be a valid JSON object."),

    body("other_optional_2")
        .optional()
        .isObject().withMessage("Must be a valid JSON object."),

    body("is_accepting_registrations")
        .optional()
        .isBoolean().withMessage("Must be a boolean value."),

    body("status")
        .optional()
        .isIn(["Not Started", "Ongoing", "Completed"]).withMessage("Invalid status value."),

    body("max_attendees")
        .optional()
        .isInt({ min: 1 }).withMessage("Max attendees must be at least 1."),

    body("registration_deadline")
        .optional()
        .isISO8601().withMessage("Invalid timestamp format."),

    body("tags")
        .optional()
        .isArray().withMessage("Tags must be an array of strings.")
        .custom((value) => value.every((tag: any) => typeof tag === "string"))
        .withMessage("Each tag must be a string."),

    body("whatlearn")
        .isArray().withMessage("Must be an array of strings.")
        .custom((value) => {
            if (!value.every((item: any) => typeof item === "string")) {
                throw new Error("Each item in whatlearn must be a string.");
            }
            return true; // Required for valid values
        }),

    body("summary")
        .isArray().withMessage("Must be an array of strings.")
        .custom((value) => {
            if (!value.every((item: any) => typeof item === "string")) {
                throw new Error("Each item in summary must be a string.");
            }
            return true;
        }),



    body("initial_price")
        .optional()
        .isInt({ min: 0 }).withMessage("Initial price must be a positive integer."),

    body("documented_price")
        .optional()
        .isFloat({ min: 0 }).withMessage("Documented price must be a positive number."),

    body("early_bird_price")
        .optional()
        .isFloat({ min: 0 }).withMessage("Must be a positive number."),

    body("late_fee")
        .optional()
        .isFloat({ min: 0 }).withMessage("Late fee must be a positive number."),

    body("total_no_of_registrations")
        .optional()
        .isInt({ min: 0 }).withMessage("Total registrations must be a non-negative integer."),

    body("total_amount_collected")
        .optional()
        .isFloat({ min: 0 }).withMessage("Total amount collected must be a positive number."),

    body("total_amount_remaining")
        .optional()
        .isFloat({ min: 0 }).withMessage("Total amount remaining must be a positive number."),

    body("meeting_link")
        .optional()
        .isURL().withMessage("Invalid meeting link format."),

    body("pdf").custom((value, { req }) => {
        if (req.files?.pdf) {
            if (req.files.pdf[0].mimetype !== "application/pdf") {
                throw new Error("Only PDF files are allowed.");
            }
        }
        return true;
    }),

    body("image").custom((value, { req }) => {
        if (!req.files?.image) {
            throw new Error("Image must be uploaded.");
        }
        return true;
    }),

    body("image").custom((value, { req }) => {
        if (req.files?.image) {
            const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
            if (!allowedTypes.includes(req.files.image[0].mimetype)) {
                throw new Error("Only JPEG, JPG, and PNG images are allowed.");
            }
        }
        return true;
    }),

    body("mode_of_event")
        .optional()
        .isString().withMessage("Mode of event must be a string."),

    body("no_of_registrations")
        .optional()
        .isInt({ min: 0 }).withMessage("Number of registrations must be a non-negative integer."),
];

export const validateEventUpdate = [
    body('title')
        .optional().notEmpty().withMessage("Title cannot be empty.")
        .isString().withMessage("Title must be a string."),

    body('added_by')
        .optional().notEmpty().withMessage("Added by (User) is required.")
        .isString().withMessage("User ID must be a string.")
        .isLength({ min: 36, max: 36 }).withMessage("Invalid added_by ID format."),

    body('event_type_id')
        .optional().notEmpty().withMessage("Event type is required.")
        .isString().withMessage("Event type ID must be a string.")
        .isLength({ min: 36, max: 36 }).withMessage("Invalid event type ID format."),


    body('speaker')
        .optional().notEmpty().withMessage("Speaker cannot be empty.")
        .isString().withMessage("Speaker must be a string."),

    body('from_date')
        .optional().notEmpty().withMessage("From date is required.")
        .isISO8601().withMessage("Invalid date format."),

    body('to_date')
        .optional().notEmpty().withMessage("To date is required.")
        .isISO8601().withMessage("Invalid date format."),

    body('from_time')
        .optional().notEmpty().withMessage("From time is required.")
        .matches(/^\d{2}:\d{2}:\d{2}$/).withMessage("Invalid time format (HH:MM:SS)."),

    body('to_time')
        .optional().notEmpty().withMessage("To time is required.")
        .matches(/^\d{2}:\d{2}:\d{2}$/).withMessage("Invalid time format (HH:MM:SS)."),

    body('paid_or_free')
        .optional().notEmpty().withMessage("Paid or Free field is required.")
        .isString().withMessage("Must be a string."),

    body('reward_id_for_attendees')
        .optional().isString().withMessage("Reward ID must be a string.")
        .isLength({ min: 36, max: 36 }).withMessage("Invalid reward ID format."),



    body('description')
        .optional().notEmpty().withMessage("Description cannot be empty.")
        .isString().withMessage("Description must be a string."),

    body('what_you_will_learn')
        .optional()
        .isString().withMessage("Must be a string."),

    body('speaker_details')
        .optional().isString().withMessage("Speaker details must be a string."),

    body('location')
        .optional().isString().withMessage("Location must be a string."),

    body('latitude')
        .optional().isFloat().withMessage("Latitude must be a number."),

    body('longitude')
        .optional().isFloat().withMessage("Longitude must be a number."),

    body('google_map_link')
        .optional().isString().withMessage("Google map link must be a string."),

    body('other_optional')
        .optional().isObject().withMessage("Must be an object."),

    body('other_optional_2')
        .optional().isObject().withMessage("Must be an object."),

    body('max_attendees')
        .optional().isInt({ min: 1 }).withMessage("Max attendees must be a positive integer."),

    body('registration_deadline')
        .optional().isISO8601().withMessage("Invalid timestamp format."),

    body('tags')
        .optional().isArray().withMessage("Tags must be an array."),

    body('initial_price')
        .optional().notEmpty().withMessage("Initial price is required.")
        .isFloat({ min: 0 }).withMessage("Initial price must be a non-negative number."),

    body('documented_price')
        .optional().notEmpty().withMessage("Documented price is required.")
        .isFloat({ min: 0 }).withMessage("Documented price must be a non-negative number."),

    body('early_bird_price')
        .optional().isFloat({ min: 0 }).withMessage("Early bird price must be a non-negative number."),

    body('late_fee')
        .optional().isFloat({ min: 0 }).withMessage("Late fee must be a non-negative number.")
];


export const validateUserID = [

    param("id")
        .notEmpty().withMessage("User ID cannot be empty.")
        .isUUID().withMessage("Invalid user ID")
        .trim()
        .escape()
]