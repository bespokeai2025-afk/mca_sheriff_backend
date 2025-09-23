
import { Request, Response } from "express";
import { EventService } from "../services/event.service";
import { errorWithData, errorWithoutData } from "../config/ApiResponse";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Admin } from "../entities/Admin";
import { AppDataSource } from "../config/database";

const adminRepository = AppDataSource.getRepository(Admin);

const eventService = new EventService();
// Get all users

export const getEvent = async (req: Request, res: Response): Promise<any> => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(400).json({ message: 'Authentication required' });
        }

        const decodedToken = await jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        const userId = decodedToken.id;

        const fromDate = req.query.from_date as string || req.query.fromDate as string;
        const toDate = req.query.to_date as string || req.query.toDate as string;

        const eventTypeId = req.query.eventTypeId as string;
        const isActiveParam = req.query.isActive as string;
        const mode_of_event = req.query.mode_of_event as string;
        const speaker = req.query.speaker as string;
        const from_time = req.query.from_time as string;
        const to_time = req.query.to_time as string;
        const status = req.query.status as string;
        const paid_or_free = req.query.paid_or_free as string;
        const isActive = isActiveParam !== undefined ? isActiveParam === 'true' : undefined;
        const { pageSize, currentPage } = req.body;
        const response = await eventService.getAllEvents(
            isActive,
            userId,
            parseInt(pageSize) || 50,
            parseInt(currentPage) || 1,
            fromDate,
            toDate,
            eventTypeId,
            mode_of_event,
            speaker,
            from_time,
            status, // Pass status correctly here
            paid_or_free,
            to_time
        );

        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return errorWithData('something went wrong', { error: error })
    }
};

export const getupcomingEvent = async (req: Request, res: Response): Promise<any> => {
    try {
        const { pageSize, currentPage } = req.body; // Extract pagination parameters

        const response = await eventService.getAllupcomingEvents(
            parseInt(pageSize) || 50, // Default to 50 items per page
            parseInt(currentPage) || 1);
        return res.status(response.result ? 200 : 400).json(response)
    } catch (error) {
        return errorWithData('something went wrong', { error: error })
    }
};
export const geteventsgroupedbytype = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await eventService.getEventsGroupedByType();
        return res.status(response.result ? 200 : 400).json(response)
    } catch (error) {
        return errorWithData('something went wrong', { error: error })
    }
};
// Get a user by ID
export const getEventById = async (req: Request, res: Response): Promise<any> => {
    try {
        const response = await eventService.findEventById(req.params.id)
        return res.status(response.result ? 200 : 400).json(response)

    } catch (error) {
        return errorWithData("something went wrong", { error: error });
    }
};
export const getEventsByType = async (req: Request, res: Response): Promise<any> => {
    try {
        const { pageSize, currentPage } = req.body; // Extract pagination parameters
        const response = await eventService.findEventsByType(
            req.params.eventType,
            parseInt(pageSize) || 50, // Default to 50 items per page
            parseInt(currentPage) || 1 // Default to page 1
        );
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        return errorWithData("Something went wrong", { error: error });
    }
};



export const createEvent = async (req: Request, res: Response): Promise<any> => {
    try {
        // ✅ Check if token is provided
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // ✅ Verify JWT Token
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "Server error: JWT secret is missing" });
        }

        let decodedToken: JwtPayload;
        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const userId = decodedToken.id;
        if (!userId) {
            return res.status(401).json({ message: "Invalid token payload" });
        }

        // ✅ Retrieve uploaded files (both image and pdf)
        const files = req.files as { [fieldname: string]: Express.MulterS3.File[] } | undefined;
        const image = files?.image?.[0]?.location || null;
        const pdf = files?.pdf?.[0]?.location || null;

        // Prepare event data
        const data = {
            ...req.body,
            image, // Store image URL
            pdf,   // Store PDF URL
        };
        // ✅ Call Service to Create Event
        const response = await eventService.createEvent(data, userId);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        console.error("Error in createEvent:", error);
        return res.status(500).json({ message: "Something went wrong", error });
    }
};




// Update a user
export const updateEvent = async (req: Request, res: Response): Promise<any> => {
    try {
        // ✅ Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({ message: "Authentication failed" });
        }

        // ✅ Verify admin permissions
        const user = await adminRepository.findOneBy({ id: req.user.id });
        if (!user) {
            return res.status(403).json({ message: "User is not authorized to update this event" });
        }

        // ✅ Retrieve uploaded files (image and PDF)
        const files = req.files as { [fieldname: string]: Express.MulterS3.File[] } | undefined;
        const image = files?.image?.[0]?.location || null;
        const pdf = files?.pdf?.[0]?.location || null;

        // ✅ Prepare update data
        const updateData = { ...req.body };
        if (image) updateData.image = image; // Only update if a new image is uploaded
        if (pdf) updateData.pdf = pdf; // Only update if a new PDF is uploaded

        // ✅ Call Service to Update Event
        const response = await eventService.updateEvent(req.params.id, updateData, req.verifyUser);
        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        console.error("Error in updateEvent:", error);
        return res.status(500).json({ message: "Something went wrong", error });
    }
};
// Delete a user
export const deleteEvent = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json(errorWithoutData("Authentication failed"));
        }

        const user = await adminRepository.findOneBy({ id: req.user.id });

        if (!user) {
            return res.status(403).json(errorWithoutData("User is not authenticated for this request"));
        }

        const response = await eventService.deleteEvent(req.params.id, req.verifyUser)
        return res.status(response.result ? 200 : 400).json(response)

    } catch (error) {
        return errorWithData("something went wrong", { error: error });
    }
};


export const activeEvent = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json(errorWithoutData("Authentication failed"));
        }

        const user = await adminRepository.findOneBy({ id: req.user.id });

        if (!user) {
            return res.status(403).json(errorWithoutData("User is not authenticated for this request"));
        }

        const response = await eventService.activeEvent(req.params.id, req.verifyUser);

        return res.status(response.result ? 200 : 400).json(response);
    } catch (error) {
        const response = errorWithData('something went wrong', { error: error });
        return res.status(response.result ? 200 : 400).json(response);
    }
};
