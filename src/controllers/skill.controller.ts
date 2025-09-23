import { Request, Response } from "express";
import { errorWithData, errorWithoutData } from "../config/ApiResponse";
import { SkillService } from "../services/skill.service";
import { AppDataSource } from "../config/database";
import { Admin } from "../entities/Admin";

// Initialize the SkillService instance
const skillService = new SkillService();

// Get the repository for the Admin entity
const adminRepository = AppDataSource.getRepository(Admin);

// Controller to get all skills
export const getSkills = async (req: Request, res: Response): Promise<any> => {
    try {
        // Fetch all skills using the skill service
        const response = await skillService.findSkills(req.verifyUser, parseInt(req.query.pageSize as string) || 50, parseInt(req.query.currentPage as string) || 1);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to get a specific skill by ID
export const getSkillById = async (req: Request, res: Response): Promise<any> => {
    // try {

    try {
        // Determine the skill ID from query parameters
        const skillId = (req.query.skillId as string) || (req.query.id as string);

        if (!skillId) {
            return res.status(400).json(errorWithData('Skill ID is required', {}));
        }

        // Fetch the skill by ID using the skill service
        const response = await skillService.findSkillById(skillId, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('Something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to get a specific skill by ID
export const getSkillsByMainCategory = async (req: Request, res: Response): Promise<any> => {
    try {

        console.log("getSkillsByMainCategory =>,Controller", req.query.id as string)
        // Fetch the skill by ID using the skill service
        const response = await skillService.findSkillByMainCategory(req.query.id as string, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('Something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }

};

// Controller to get a specific skill by ID
export const findAllSkillsByCategoryId = async (req: Request, res: Response): Promise<any> => {
    try {
      const categoryId = req.query.id as string;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined;
      const currentPage = req.query.currentPage ? parseInt(req.query.currentPage as string) : undefined;
  
      const response = await skillService.findAllSkillsByCategoryId(categoryId, req.verifyUser, pageSize, currentPage);
      return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
      const response = errorWithData('Something went wrong', { error });
      return res.status(400).json(response);
    }
  };
  

// Controller to create a new skill
export const createSkill = async (req: Request, res: Response): Promise<any> => {
    try {
        // Check if the user is authenticated
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }

        // Create a new skill using the skill service
        const response: any = await skillService.createSkill(req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to update an existing skill
export const updateSkill = async (req: Request, res: Response): Promise<any> => {
    try {
        // Check if the user is authenticated
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }


        // Update the skill using the skill service
        const response = await skillService.updateSkill(req.params.id, req.body, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};

// Controller to delete a skill
export const deleteSkill = async (req: Request, res: Response): Promise<any> => {
    try {
        // Check if the user is authenticated
        if (!req.user) {
            const response = errorWithoutData("Authentication failed");
            return res.status(response.result ? 200 : 400).json(response);
        }
        const user = await adminRepository.findOneBy({ id: req.user.id });

        // If user is not found, return an error response
        if (!user) {
            const response = errorWithoutData('User  is not Authenticated for this request');
            return res.status(response.result ? 200 : 400).json(response);
        }

        // Delete the skill using the skill service
        const response = await skillService.deleteSkill(req.params.id, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        // Handle any errors that occur during the process
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};