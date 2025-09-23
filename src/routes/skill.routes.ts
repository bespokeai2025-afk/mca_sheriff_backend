import express from "express";
import { validateUserID } from "../middlewares/user.validation";
import { validateRequest } from "../middlewares/otp.validation";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import { createSkill, deleteSkill, getSkillById, getSkills, updateSkill, getSkillsByMainCategory, findAllSkillsByCategoryId } from "../controllers/skill.controller";
import { validateSkill, validateUpdateSkill } from "../middlewares/skill.validation";

const router = express.Router();

router.get("/all", verifyAccessToken, getSkills);
router.get("/allbymaincateogry", verifyAccessToken, getSkillsByMainCategory);
router.get("/findAllSkillsByCategoryId", verifyAccessToken, findAllSkillsByCategoryId);
router.get("/", verifyAccessToken, getSkillById);

router.post("/create", verifyAccessToken, validateSkill, validateRequest, createSkill);
router.put("/update/:id", verifyAccessToken, validateUserID, validateUpdateSkill, validateRequest, updateSkill);
router.delete("/delete/:id", verifyAccessToken, validateUserID, validateRequest, deleteSkill);

export default router;
