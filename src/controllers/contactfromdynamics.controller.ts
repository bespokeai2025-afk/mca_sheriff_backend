import { Request, Response } from "express";
import { fetchContacts } from "../services/contactfromdynamics.service";

// controller
export const getContacts = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "50", 10);
    const pageUrl = req.query.pageUrl ? decodeURIComponent(req.query.pageUrl as string) : undefined;

    const dynamicsData = await fetchContacts(pageUrl);

    // server-side pagination only if nextLink is not used
    const start = pageUrl ? 0 : (page - 1) * limit;
    const end = pageUrl ? dynamicsData.value.length : start + limit;
    const paginatedData = dynamicsData.value.slice(start, end);

    res.status(200).json({
      success: true,
      message: "Contacts fetched successfully",
      data: paginatedData,
      totalRecords: dynamicsData.totalRecords,
      currentPage: page,
      totalPages: Math.ceil(dynamicsData.totalRecords / limit),
      nextLink: dynamicsData.nextLink,
      isNextLink: dynamicsData.isNextLink,
    });
  } catch (error: any) {
    console.error("Error fetching contacts:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch contacts", error: error.message });
  }
};
