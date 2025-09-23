import { body, param } from "express-validator";

export const validateCallOutputData = [
  body("vendor_id")
    .notEmpty().withMessage("Vendor ID is required.")
    .isString().withMessage("Vendor ID must be a string")
    .trim()
    .escape(),

  body("crm_data_id")
    .notEmpty().withMessage("CRM Data ID is required.")
    .isString().withMessage("CRM Data ID must be a string")
    .trim()
    .escape(),

//   body("sentiment_analysis")
//     .notEmpty().withMessage("Sentiment analysis is required.")
//     .isString().withMessage("Sentiment analysis must be a string")
//     .trim()
//     .escape(),

//   body("end_reason")
//     .notEmpty().withMessage("End reason is required.")
//     .isString().withMessage("End reason must be a string")
//     .trim()
//     .escape(),

//   body("call_status")
//     .optional({ nullable: true })
//     .isIn(["connected", "user_busy", "disconnected", null])
//     .withMessage("Invalid call status"),

//   body("agent_name")
//     .notEmpty().withMessage("Agent name is required.")
//     .isString().withMessage("Agent name must be a string")
//     .trim()
//     .escape(),

//   body("customer_name")
//     .notEmpty().withMessage("Customer name is required.")
//     .isString().withMessage("Customer name must be a string")
//     .trim()
//     .escape(),

//   body("from_number")
//     .notEmpty().withMessage("From number is required.")
//     .isString().withMessage("From number must be a string")
//     .isLength({ min: 10, max: 15 }).withMessage("From number must be between 10 to 15 characters")
//     .trim()
//     .escape(),

//   body("to_number")
//     .notEmpty().withMessage("To number is required.")
//     .isString().withMessage("To number must be a string")
//     .isLength({ min: 10, max: 15 }).withMessage("To number must be between 10 to 15 characters")
//     .trim()
//     .escape(),

//   body("start_timestamp")
//     .notEmpty().withMessage("Start timestamp is required.")
//     .isInt({ min: 0 }).withMessage("Start timestamp must be a positive integer"),

//   body("end_timestamp")
//     .notEmpty().withMessage("End timestamp is required.")
//     .isInt({ min: 0 }).withMessage("End timestamp must be a positive integer"),

//   body("duration_ms")
//     .notEmpty().withMessage("Duration is required.")
//     .isInt({ min: 0 }).withMessage("Duration must be a positive integer"),

//   body("direction")
//     .notEmpty().withMessage("Direction is required.")
//     .isString().withMessage("Direction must be a string"),

//   body("transcript")
//     .notEmpty().withMessage("Transcript is required.")
//     .isString().withMessage("Transcript must be a string"),

//   body("call_summary")
//     .notEmpty().withMessage("Call summary is required.")
//     .isString().withMessage("Call summary must be a string"),

//   body("recording_url")
//     .notEmpty().withMessage("Recording URL is required.")
//     .isURL().withMessage("Recording URL must be a valid URL"),

//   body("user_sentiment")
//     .notEmpty().withMessage("User sentiment is required.")
//     .isString().withMessage("User sentiment must be a string"),

//   body("call_successful")
//     .notEmpty().withMessage("Call successful flag is required.")
//     .isBoolean().withMessage("Call successful must be a boolean"),

//   body("customer_was_satisfied")
//     .notEmpty().withMessage("Customer satisfaction flag is required.")
//     .isBoolean().withMessage("Customer satisfaction must be a boolean"),

//   body("reason_for_call")
//     .notEmpty().withMessage("Reason for call is required.")
//     .isString().withMessage("Reason for call must be a string"),

//   body("call_cost_combined_cost")
//     .notEmpty().withMessage("Call cost is required.")
//     .isFloat({ min: 0 }).withMessage("Call cost must be a positive number"),

//   body("latency_e2e_p50")
//     .notEmpty().withMessage("Latency is required.")
//     .isInt({ min: 0 }).withMessage("Latency must be a positive integer"),

//   body("disconnection_reason")
//     .notEmpty().withMessage("Disconnection reason is required.")
//     .isString().withMessage("Disconnection reason must be a string"),

//   body("llm_token_usage_average")
//     .notEmpty().withMessage("LLM token usage is required.")
//     .isFloat({ min: 0 }).withMessage("LLM token usage must be a positive number"),

//   body("telephony_identifier_twilio_call_sid")
//     .notEmpty().withMessage("Twilio Call SID is required.")
//     .isString().withMessage("Twilio Call SID must be a string"),

//   body("event")
//     .notEmpty().withMessage("Event is required.")
//     .isString().withMessage("Event must be a string"),

//   body("call_type")
//     .notEmpty().withMessage("Call type is required.")
//     .isString().withMessage("Call type must be a string"),

//   body("agent_version")
//     .notEmpty().withMessage("Agent version is required.")
//     .isString().withMessage("Agent version must be a string")
];

export const validateUserID = [
  param("id")
    .notEmpty().withMessage("User ID cannot be empty.")
    .isUUID().withMessage("Invalid user ID")
    .trim()
    .escape()
];
