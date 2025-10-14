import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { AreaCount } from "../entities/AreaCount";

const areaCountRepo = AppDataSource.getRepository(AreaCount);

// ✅ Add new record
export const addAreaCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { count } = req.body;
    const newArea = areaCountRepo.create({ count });
    const saved = await areaCountRepo.save(newArea);

    res.status(201).json({
      message: "Area count added successfully",
      data: saved,
    });
  } catch (error) {
    console.error("Error adding area count:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Edit record by ID
// ✅ Edit record by ID (auto-create if table is empty)
export const editAreaCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { count, isActive, isDeleted } = req.body;

    // 1️⃣ Check if table has any records
    const allRecords = await areaCountRepo.find();

    if (allRecords.length === 0) {
      // 2️⃣ No records — create new one instead
      const newArea = areaCountRepo.create({ count });
      const saved = await areaCountRepo.save(newArea);

      res.status(201).json({
        message: "No record found, new AreaCount created successfully",
        data: saved,
      });
      return;
    }

    // 3️⃣ Otherwise, try to find record by ID and update it
    const existing = await areaCountRepo.findOne({ where: { id } });

    if (!existing) {
      res.status(404).json({ message: "Record not found for given ID" });
      return;
    }

    existing.count = count ?? existing.count;
    existing.isActive = isActive ?? existing.isActive;
    existing.isDeleted = isDeleted ?? existing.isDeleted;

    const updated = await areaCountRepo.save(existing);

    res.json({
      message: "Area count updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating/creating area count:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// ✅ Fetch all active records
export const getAllAreaCounts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await areaCountRepo.find({
      where: { isDeleted: false },
      order: { createdAt: "DESC" },
    });

    res.json({
      message: "Area counts fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Error fetching area counts:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
