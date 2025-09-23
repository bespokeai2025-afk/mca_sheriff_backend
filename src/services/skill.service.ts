import { Skill } from "../entities/Skills";
import {
  errorWithoutData,
  successWithData,
  successWithoutData,
} from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { MainCategory } from "../entities/MainCategory";
import { deleteUserToken } from "../utils/jwtUtils";

export class SkillService {
  private skillRepository = AppDataSource.getRepository(Skill);
  private mainCategoryRepository = AppDataSource.getRepository(MainCategory);
  public async findSkills(
    verifyUser: any,
    pageSize: number,
    currentPage: number
  ) {
    let whereCondition = {};
    if (verifyUser.user_exist) {
      whereCondition = { isActive: true, isDeleted: false };
    }
    if (verifyUser.admin_exist) {
      whereCondition = { isDeleted: false };
    }

    const [skills, totalItems] = await this.skillRepository.findAndCount({
      where: whereCondition,
      order: { createdAt: "DESC" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      relations: ["main_category_id"],
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    return successWithData("all skills", skills, {
      totalItems,
      totalPages,
      currentPage,
      pageSize,
    });
  }

  public async findAllSkillsByCategoryId(
    id: string,
    verifyUser: any,
    pageSize?: number,
    currentPage?: number
  ) {
    let whereCondition = {};
  
    if (verifyUser.admin_exist) {
      whereCondition = { isDeleted: false, main_category_id: { id } };
    }
  
    const findOptions: any = {
      where: whereCondition,
      order: { createdAt: "DESC" },
      relations: ["main_category_id"],
    };
  
    if (pageSize && currentPage) {
      findOptions.skip = (currentPage - 1) * pageSize;
      findOptions.take = pageSize;
    }
  
    const [skills, totalItems] = await this.skillRepository.findAndCount(findOptions);
  
    const totalPages = pageSize ? Math.ceil(totalItems / pageSize) : 1;
  
    return successWithData("all skills by main category id", skills, {
      totalItems,
      totalPages,
      currentPage: currentPage || 1,
      pageSize: pageSize || totalItems,
    });
  }
  
  public async findSkillById(id: string, verifyUser: any) {
    let skill;
    if (verifyUser.user_exist) {
      skill = await this.skillRepository.findOne({
        where: { id, isActive: true, isDeleted: false },
        relations: ["main_category_id"],
      });
    } else {
      skill = await this.skillRepository.findOne({
        where: { id },
        relations: ["main_category_id"],
      });
    }

    if (!skill) {
      return errorWithoutData("skill not found");
    }

    return successWithData("skill found", skill);
  }

  public async findSkillByMainCategory(id: string, verifyUser: any) {

    let skill;
    if (verifyUser.user_exist) {
      skill = await this.skillRepository.find({
        where: { main_category_id: { id }, isActive: true, isDeleted: false },
        relations: ["main_category_id"],
      });
    } else {
      skill = await this.skillRepository.find({
        where: { main_category_id: { id } },
        relations: ["main_category_id"],
      });
    }

    if (!skill) {
      return errorWithoutData("skill not found");
    }

    let skills: {
      main_category_id: string;
      category_name: string;
      skill_id: string;
      skill_name: string;
    }[] = [];

    if (skill.length > 0) {
      console.log(skills.length);
      try {
        skill.forEach((sk: Skill) => {
          skills.push({
            main_category_id: sk.main_category_id.id,
            category_name: sk.main_category_id.name,
            skill_id: sk.id,
            skill_name: sk.name,
          });
        });
      } catch (error) {
        console.log(error);
      }
    }

    console.log(skills);

    return successWithData("skill found", skills);
  }

  public async createSkill(data: { [key: string]: any }, verifyUser: any) {
    if (verifyUser.user_exist) {
      return errorWithoutData("Only admin can create skills");
    }
    const { main_category_id } = data;

    const main_category = await this.mainCategoryRepository.findOneBy({
      id: main_category_id,
    });

    if (!main_category) return errorWithoutData("main category ID required");

    delete data.main_category_id;

    data = { ...data, main_category_id: { id: main_category.id } };

    const newSkill = await this.skillRepository.create(data);
    const skill = await this.skillRepository.save(newSkill);

    return successWithData("Skill Created successfully", skill);
  }

  public async updateSkill(
    id: string,
    data: { [key: string]: any },
    verifyUser: any
  ) {
    if (verifyUser.user_exist) {
      return errorWithoutData("Only admin can update skills");
    }

    const skill = await this.skillRepository.findOne({
      where: {
        id,
        isDeleted: false,
      },
      relations: ["main_category_id"],
    });
    if (!skill) {
      return errorWithoutData("skill not found");
    }

    await this.skillRepository.update(id.toString(), data);

    return successWithoutData("skill updated successfully");
  }

  public async deleteSkill(id: string, verifyUser: any) {
    if (verifyUser.user_exist) {
      return errorWithoutData("Only admin can delete skills");
    }
    const skill = await this.skillRepository.findOneBy({
      id,
      isActive: true,
      isDeleted: false,
    });

    if (!skill) {
      return errorWithoutData("skill not found");
    }

    skill.isDeleted = true;
    skill.isActive = false;

    await this.skillRepository.save(skill);

    return successWithoutData("skill deleted Successfully");
  }
}
