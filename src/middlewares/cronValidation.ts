import { body } from "express-validator";
import { isValidCron } from "cron-validator";

/**
 * Validate call_frequency_setting field (required and valid cron)
 */
export const validateCron = [
  body("call_frequency_setting")
    .notEmpty()
    .withMessage("call_frequency_setting is required")
    .custom((value: string) => {
      const valid = isValidCron(value, { seconds: false });
      if (!valid) {
        throw new Error(
          "Invalid cron expression. Example: '30 5 * * 1,6'"
        );
      }
      return true;
    }),
];
