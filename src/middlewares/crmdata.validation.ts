import { body, param } from "express-validator";
import { CRMData } from "../entities/CRMData";
import { AppDataSource } from "../config/database"; 

const crmRepository = AppDataSource.getRepository(CRMData);

export const validatecrmdata = [
  body("name")
    .notEmpty().withMessage("Name is required.")
    .isString().withMessage("Name must be a string")
    .trim()
    .escape(),

  body("mobile_number")
    .notEmpty().withMessage("Mobile number is required.")
    .isString().withMessage("Mobile number must be a string")
    .isLength({ min: 10, max: 15 }).withMessage("Mobile number must be between 10 to 15 characters")
    .trim()
    .escape()
    .custom(async (value) => {
      const existingUser = await crmRepository.findOne({
        where: { mobile_number: value },
      });

      if (existingUser) {
        return Promise.reject("Mobile number already exists.");
      }
    }),
];

export const validateUserID = [
  param("id")
    .notEmpty().withMessage("User ID cannot be empty.")
    .isUUID().withMessage("Invalid user ID")
    .trim()
    .escape(),
];
