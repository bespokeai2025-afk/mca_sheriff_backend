import { EventType } from "../entities/EventTypes";
import {
  errorWithData,
  errorWithoutData,
  successWithData,
  successWithoutData,
} from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { Not } from "typeorm";
import s3 from "../config/s3Bucket";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export class EventsTypeService {
  private eventType = AppDataSource.getRepository(EventType);
  public async geteventstype(
    isActive: boolean | undefined,
    pageSize: number = 50,
    currentPage: number = 1,
    verifyUser: any
  ) {
    const whereCondition: any = { isDeleted: false };

    // Apply filtering if isActive is provided
    if (isActive !== undefined) {
      whereCondition.isActive = isActive;
    }

    let whereCd = {};
    if (verifyUser.user_exist) {
      whereCd = { isActive: true, isDeleted: false };
    }

    if (verifyUser.admin_exist) {
      whereCd = { isDeleted: false };
    }

    const [eventstype, total] = await this.eventType.findAndCount({
      where: { ...whereCd, ...whereCondition },
      take: pageSize, // Limit results per page
      skip: (currentPage - 1) * pageSize, // Skip for pagination
      order: { createdAt: "DESC" }, // Sorting in descending order by createdAt

    });

    return successWithData("All event Type ", {
      data: eventstype,
      currentPage,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      totalRecords: total,
    });
  }

  public async findeventstypeById(id: string) {
    const eventstype = await this.eventType.findOneBy({ id });

    if (!eventstype) {
      return errorWithoutData("main event not found");
    }

    return successWithData(" event Type found", eventstype);
  }

  public async createeventstype(Data: {
    name: string;
    sequenceNo: string;
    description?: string;
    isActive?: boolean;
    verifyUser: any;
  }) {
    // Check if an event type with the same name exists

    const existingEventType = await this.eventType.findOneBy({
      name: Data.name, isDeleted: false,
    });
    if (existingEventType) {
      return errorWithoutData(
        "Event type with this name already exists. Please choose a different name."
      );
    }

    // Check if an event type with the same sequenceNo exists
    // const existingSequenceNo = await this.eventType.findOneBy({
    //   sequenceNo: Data.sequenceNo,isDeleted: false
    // });
    // if (existingSequenceNo) {
    //   return errorWithoutData(
    //     "Event type with this sequence number already exists. Please choose a different sequence number."
    //   );
    // }

    const neweventstype = await this.eventType.create(Data);

    try {
      const eventstype = await this.eventType.save(neweventstype);

      if (!eventstype) {
        return errorWithoutData("event Type  not created");
      }
      return successWithData(" event Type created successfully", eventstype);
    } catch (err) {
      return errorWithData("Error", { error: err });
    }
  }

  public async updateeventstype(
    id: string,
    data: Partial<EventType>,
    verifyUser: any
  ) {
    if (verifyUser.user_exist) {
      return errorWithoutData("User cannot update attendance");
    }

    const eventstype = await this.eventType.findOne({ where: { id } });

    if (!eventstype) {
      return errorWithoutData("Main event not found");
    }

    // Check if another event type exists with the same name
    if (data.name) {
      const existingEventType = await this.eventType.findOne({
        where: { name: data.name, id: Not(id) },
      });
      if (existingEventType) {
        return errorWithoutData(
          "Event type with this name already exists. Please choose a different name."
        );
      }
    }

    // Check if another event type exists with the same sequenceNo
    if (data.sequenceNo) {
      const existingSequenceNo = await this.eventType.findOne({
        where: { sequenceNo: data.sequenceNo, id: Not(id) },
      });
      if (existingSequenceNo) {
        return errorWithoutData(
          "Event type with this sequence number already exists. Please choose a different sequence number."
        );
      }
    }

    // If a new image is provided, delete the old one from S3
    if (data.image) {
      if (eventstype.image) {
        const oldKey = eventstype.image.split(".com/")[1];
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME!, Key: oldKey }));
      }
    } else {
      // Keep the existing image if no new image is provided
      data.image = eventstype.image;
    }

    const updatedData = JSON.parse(JSON.stringify(data));

    await this.eventType.update(id.toString(), updatedData);
    return successWithoutData("Event type updated successfully");
  }


  public async deleteeventstype(id: string, verifyUser: any) {
    if (verifyUser.user_exist) {
      return errorWithoutData("user cann't update attendance");
    }
    const eventstype = await this.eventType.findOneBy({ id });

    if (!eventstype) {
      return errorWithoutData(" event-type not found");
    }

    eventstype.isDeleted = true; // Mark as soft deleted
    await this.eventType.save(eventstype);

    return successWithoutData("Main event-type soft deleted successfully");
  }
  public async activeEventtype(id: string, verifyUser: any) {
    if (verifyUser.user_exist) {
      return errorWithoutData("user cann't update attendance");
    }
    const eventType = await this.eventType.findOneBy({ id });

    if (!eventType) {
      return errorWithoutData("Event not found");
    }

    eventType.isActive = false; // Mark as deleted
    await this.eventType.save(eventType);

    return successWithoutData("Event-type dectivetd successfully");
  }
}
