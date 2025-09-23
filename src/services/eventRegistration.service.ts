import { EventRegistration } from "../entities/EventRegistration";
import { Event } from "../entities/Event";
import { User } from "../entities/User";
import { AppDataSource } from "../config/database";
import { Equal } from 'typeorm';

import {
  successWithData,
  errorWithoutData,
  successWithoutData,
} from "../config/ApiResponse";
import { deleteUserToken } from "../utils/jwtUtils";
import { UserService } from "./user.service";
import { BlobOptions } from "buffer";

import { EventAttendance } from "../entities/EventAttendance";
export class EventRegistrationService {
  private registrationRepository = AppDataSource.getRepository(EventRegistration);
  private eventRepository = AppDataSource.getRepository(Event);
  private userRepository = AppDataSource.getRepository(User);
  private attendanceRepository = AppDataSource.getRepository(EventAttendance);

  public async registerUser(
    data: { eventId: string; userId: string; eventTypeId?: string },
    verifyUser: any
  ) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // 1. Lock the event row directly without relations
      let event = await queryRunner.manager.findOne(this.eventRepository.target, {
        where: { id: data.eventId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!event) throw new Error("Event not found");

      // 2. Manually load the relation (event_type_id)
      const eventType = await this.eventRepository.findOne({
        where: { id: data.eventId },
        relations: ["event_type_id"],
      });

      const user = await this.userRepository.findOneBy({ id: data.userId });

      if (!event) throw new Error("Event not found");
      if (!user) throw new Error("User not found");

      if (verifyUser.admin_exist || verifyUser.user_exist.id != user.id)
        throw new Error("Unauthorized access");


      if (user.is_email_verified == false)
        throw new Error("Email not verified");

      console.log(event)

      const currentDateTime = new Date();

      const eventStartDateTime = new Date(event.event_start_time_utc);
      const eventEndDateTime = new Date(event.event_end_time_utc);

      const registered = await this.registrationRepository.findOne({
        where: {
          user_id: Equal(user.id),
          event_id: Equal(event.id),
          isActive: true,
          isDeleted: false,
          void: false
        },
      });

      if (registered) {
        throw new Error("User already registered for this event");
      }

      // ✅ Check if seats are full
      if (event.no_of_registrations >= event.max_attendees)
        throw new Error("No seats available.");


      if (currentDateTime > event.registration_deadline)
        throw new Error("Registration is closed")
      else if (currentDateTime > eventStartDateTime)
        throw new Error("Event is already started.");

      if (event.status === "Completed")
        throw new Error("Event has already ended.");

      const registration = this.registrationRepository.create({
        event_id: { id: event.id },
        user_id: { id: user.id },
        event_type_id: { id: eventType?.event_type_id.id },
      });

      await queryRunner.manager.save(this.registrationRepository.target, registration);
      await queryRunner.manager.update(this.eventRepository.target, event.id, {
        no_of_registrations: event.no_of_registrations + 1,
      });

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return successWithData("User registered successfully", registration);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      return errorWithoutData(error.message || "Something went wrong");
    }
  }

  public async getAllRegistrations(
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


    const [registration, totalItems] =
      await this.registrationRepository.findAndCount({
        where: { ...whereCondition, status: "Registered", void: false },
        order: { createdAt: "DESC" },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        relations: ["event_id", "user_id", "event_type_id"],

      });

    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalItems >= 1 && totalPages < currentPage) {
      return errorWithoutData("Page limit exceeded");
    }

    const all_regs = await Promise.all(
      registration.map(async (a) => {
        // Exclude explicitly defined properties from spreading
        const {
          id: registration_id,
          status,
          cancellation_reason,
          cancelled_at,
          cancelled_by,
          event_id,
          event_type_id,
          user_id,
          ...rest // Remaining properties
        } = a;

        return {
          registration_id: a.id,
          status: a.status,
          cancellation_reason: a?.cancellation_reason,
          cancelled_at: a?.cancelled_at,
          cancelled_by: a?.cancelled_by,
          event_id: a.event_id.id,
          event_title: a.event_id.title,
          event_from_date: a.event_id.from_date,
          event_to_date: a.event_id.to_date,
          event_from_time: a.event_id.from_time,
          event_to_time: a.event_id.to_time,
          event_type_id: a.event_type_id?.id,
          event_type: a.event_type_id?.name,
          event_speaker: a.event_id.speaker,
          event_speaker_details: a.event_id.speaker_details,
          event_event_image: a.event_id.image,
          event_paid_or_free: a.event_id.paid_or_free,
          event_reward_id_for_attendees: a.event_id.reward_id_for_attendees?.id,
          event_description: a.event_id.description,
          event_what_you_will_learn: a.event_id.what_you_will_learn,
          event_location: a.event_id.location,
          event_latitude: a.event_id.latitude,
          event_longitude: a.event_id.longitude,
          event_google_map_link: a.event_id.google_map_link,
          event_other_optional: a.event_id.other_optional,
          event_other_optional_2: a.event_id.other_optional_2,
          event_is_accepting_registrations:
            a.event_id.is_accepting_registrations,
          event_event_status: a.event_id.status,
          event_max_attendees: a.event_id.max_attendees,
          event_registration_deadline: a.event_id.registration_deadline,
          event_tags: a.event_id.tags,
          event_whatlearn: a.event_id.whatlearn,
          event_summary: a.event_id.summary,
          event_initial_price: a.event_id.initial_price,
          event_documented_price: a.event_id.documented_price,
          event_early_bird_price: a.event_id.early_bird_price,
          event_late_fee: a.event_id.late_fee,
          event_total_no_of_registrations: a.event_id.total_no_of_registrations,
          event_total_amount_collected: a.event_id.total_amount_collected,
          event_total_amount_remaining: a.event_id.total_amount_remaining,
          event_meeting_Link: a.event_id.meeting_Link,
          event_pdf: a.event_id.pdf,
          event_mode_of_event: a.event_id.mode_of_event,
          event_no_of_registrations: a.event_id.no_of_registrations,
          speaker: a.event_id.speaker,
          speaker_details: a.event_id.speaker_details,
          event_image: a.event_id.image,
          user_id: a.user_id.id,
          user_name: a.user_id.name,
          user_mobile: a.user_id.mobile,
          user_email: a.user_id.email,
          ...rest,
        };
      })
    );

    return successWithData("All event registrations", all_regs, {
      totalItems,
      totalPages,
      currentPage,
      pageSize,
    });
  }

  public async getAllRegistrationsByEventId(
    event_id: string,
    verifyUser: any,
    pageSize: number,
    currentPage: number
  ) {
    let whereCondition = {};
    if (verifyUser.user_exist) {
      whereCondition = { isActive: true, isDeleted: false, void: false };
    }

    if (verifyUser.admin_exist) {
      whereCondition = { isDeleted: false, void: false };
    }



    const [registration, totalItems] =
      await this.registrationRepository.findAndCount({
        where: {
          ...whereCondition,
          event_id: { id: event_id },
          status: "Registered",
        },
        order: { createdAt: "DESC" },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        relations: ["event_id", "user_id", "event_type_id"],
      });

    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalItems >= 1 && totalPages < currentPage) {
      return errorWithoutData("Page limit exceeded");
    }

    const all_regs = await Promise.all(
      registration.map(async (a) => {
        return {
          registration_id: a.id,
          event_isdeleted: a.event_id.isDeleted,
          status: a.status,
          cancellation_reason: a?.cancellation_reason,
          cancelled_at: a?.cancelled_at,
          cancelled_by: a?.cancelled_by,
          event_id: a.event_id.id,
          event_title: a.event_id.title,
          event_from_date: a.event_id.from_date,
          event_to_date: a.event_id.to_date,
          event_from_time: a.event_id.from_time,
          event_to_time: a.event_id.to_time,
          event_type_id: a.event_type_id?.id,
          event_type: a.event_type_id?.name,
          event_speaker: a.event_id.speaker,
          event_speaker_details: a.event_id.speaker_details,
          event_event_image: a.event_id.image,
          event_paid_or_free: a.event_id.paid_or_free,
          event_reward_id_for_attendees: a.event_id.reward_id_for_attendees?.id,
          event_description: a.event_id.description,
          event_what_you_will_learn: a.event_id.what_you_will_learn,
          event_location: a.event_id.location,
          event_latitude: a.event_id.latitude,
          event_longitude: a.event_id.longitude,
          event_google_map_link: a.event_id.google_map_link,
          event_other_optional: a.event_id.other_optional,
          event_other_optional_2: a.event_id.other_optional_2,
          event_is_accepting_registrations:
            a.event_id.is_accepting_registrations,
          event_event_status: a.event_id.status,
          event_max_attendees: a.event_id.max_attendees,
          event_registration_deadline: a.event_id.registration_deadline,
          event_tags: a.event_id.tags,
          event_whatlearn: a.event_id.whatlearn,
          event_summary: a.event_id.summary,
          event_initial_price: a.event_id.initial_price,
          event_documented_price: a.event_id.documented_price,
          event_early_bird_price: a.event_id.early_bird_price,
          event_late_fee: a.event_id.late_fee,
          event_total_no_of_registrations: a.event_id.total_no_of_registrations,
          event_total_amount_collected: a.event_id.total_amount_collected,
          event_total_amount_remaining: a.event_id.total_amount_remaining,
          event_meeting_Link: a.event_id.meeting_Link,
          event_pdf: a.event_id.pdf,
          event_mode_of_event: a.event_id.mode_of_event,
          event_no_of_registrations: a.event_id.no_of_registrations,
          speaker: a.event_id.speaker,
          speaker_details: a.event_id.speaker_details,
          event_image: a.event_id.image,
          user_id: a.user_id.id,
          user_name: a.user_id.name,
          user_mobile: a.user_id.mobile,
          user_email: a.user_id.email,
        };
      })
    );

    return successWithData(`All registrations of event ${event_id}`, all_regs, {
      totalItems,
      totalPages,
      currentPage,
      pageSize,
    });
  }

  public async getAllRegistrationsByUserId(
    user_id: string,
    verifyUser: any,
    pageSize: number,
    currentPage: number
  ) {
    let whereCondition = {};
    if (verifyUser.user_exist) {
      whereCondition = { isActive: true, isDeleted: false, void: false };
    }

    if (verifyUser.admin_exist) {
      whereCondition = { isDeleted: false, void: false };
    }

    const [registration, totalItems] =
      await this.registrationRepository.findAndCount({
        where: {
          ...whereCondition,
          user_id: { id: user_id },
          status: "Registered",
        },
        order: { createdAt: "DESC" },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        relations: ["event_id", "user_id", "event_type_id"],
      });

    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalItems >= 1 && totalPages < currentPage) {
      return errorWithoutData("Page limit exceeded");
    }

    const all_regs = await Promise.all(
      registration.map(async (a) => {
        // return {
        //     registration_id: a.id, status: a.status, cancellation_reason: a?.cancellation_reason, cancelled_at: a?.cancelled_at, cancelled_by: a?.cancelled_by, event_id: a.event_id.id, event_title: a.event_id.title, event_from_date: a.event_id.from_date, event_to_date: a.event_id.to_date, event_from_time: a.event_id.from_time, event_to_time: a.event_id.to_time, event_type_id: a.event_type_id?.id,
        //     event_type: a.event_type_id?.name, speaker: a.event_id.speaker, speaker_details: a.event_id.speaker_details,
        //     event_image: a.event_id.image, user_id: a.user_id.id, user_name: a.user_id.name, user_mobile: a.user_id.mobile, user_email: a.user_id.email
        // };
        return {
          registration_id: a.id,
          status: a.status,
          event_isdeleted: a.event_id.isDeleted,
          cancellation_reason: a?.cancellation_reason,
          cancelled_at: a?.cancelled_at,
          cancelled_by: a?.cancelled_by,
          event_id: a.event_id.id,
          event_title: a.event_id.title,
          event_from_date: a.event_id.from_date,
          event_to_date: a.event_id.to_date,
          event_from_time: a.event_id.from_time,
          event_to_time: a.event_id.to_time,
          event_type_id: a.event_type_id?.id,
          event_type: a.event_type_id?.name,
          event_speaker: a.event_id.speaker,
          event_speaker_details: a.event_id.speaker_details,
          event_event_image: a.event_id.image,
          event_paid_or_free: a.event_id.paid_or_free,
          event_reward_id_for_attendees: a.event_id.reward_id_for_attendees?.id,
          event_description: a.event_id.description,
          event_what_you_will_learn: a.event_id.what_you_will_learn,
          event_location: a.event_id.location,
          event_latitude: a.event_id.latitude,
          event_longitude: a.event_id.longitude,
          event_google_map_link: a.event_id.google_map_link,
          event_other_optional: a.event_id.other_optional,
          event_other_optional_2: a.event_id.other_optional_2,
          event_is_accepting_registrations:
            a.event_id.is_accepting_registrations,
          event_event_status: a.event_id.status,
          event_max_attendees: a.event_id.max_attendees,
          event_registration_deadline: a.event_id.registration_deadline,
          event_tags: a.event_id.tags,
          event_whatlearn: a.event_id.whatlearn,
          event_summary: a.event_id.summary,
          event_initial_price: a.event_id.initial_price,
          event_documented_price: a.event_id.documented_price,
          event_early_bird_price: a.event_id.early_bird_price,
          event_late_fee: a.event_id.late_fee,
          event_total_no_of_registrations: a.event_id.total_no_of_registrations,
          event_total_amount_collected: a.event_id.total_amount_collected,
          event_total_amount_remaining: a.event_id.total_amount_remaining,
          event_meeting_Link: a.event_id.meeting_Link,
          event_pdf: a.event_id.pdf,
          event_mode_of_event: a.event_id.mode_of_event,
          event_no_of_registrations: a.event_id.no_of_registrations,
          user_id: a.user_id.id,
          user_name: a.user_id.name,
          user_mobile: a.user_id.mobile,
          user_email: a.user_id.email,
        };
      })
    );
    return successWithData(`All registrations of user ${user_id}`, all_regs, {
      totalItems,
      totalPages,
      currentPage,
      pageSize,
    });
  }

  public async getAllRegistrationIdsByUserId(
    user_id: string,
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

    const [registration, totalItems] =
      await this.registrationRepository.findAndCount({
        where: {
          ...whereCondition,
          user_id: { id: user_id },
          status: "Registered",
        },
        order: { createdAt: "DESC" },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        relations: ["event_id", "user_id", "event_type_id"],
      });

    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalItems >= 1 && totalItems >= 1 && totalPages < currentPage) {
      return errorWithoutData("Page limit exceeded");
    }


    const all_regs = await Promise.all(
      registration.map(async (a) => {

        return {
          registration_id: a.id,
          status: a.status,
          event_id: a.event_id.id,
          void: a.void
        };
      })
    );
    return successWithData(`All Event Registration IDs of user ${user_id}`, all_regs, {
      totalItems,
      totalPages,
      currentPage,
      pageSize,
    });
  }

  public async getAllRegistrationsByEventIdUserId(
    event_id: string,
    user_id: string,
    verifyUser: any,
    pageSize: number,
    currentPage: number
  ) {
    let whereCondition = {};
    if (verifyUser.user_exist) {
      whereCondition = { isActive: true, isDeleted: false, void: false };
    }

    if (verifyUser.admin_exist) {
      whereCondition = { isDeleted: false, void: false };
    }

    const [registration, totalItems] =
      await this.registrationRepository.findAndCount({
        where: {
          ...whereCondition,
          event_id: { id: event_id },
          user_id: { id: user_id },
          status: "Registered",
        },
        order: { createdAt: "DESC" },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        relations: ["event_id", "user_id", "event_type_id"],
      });

    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalItems >= 1 && totalPages < currentPage) {
      return errorWithoutData("Page limit exceeded");
    }

    const all_regs = await Promise.all(
      registration.map(async (a) => {
        return {
          registration_id: a.id,
          status: a.status,
          cancellation_reason: a?.cancellation_reason,
          cancelled_at: a?.cancelled_at,
          cancelled_by: a?.cancelled_by,
          event_id: a.event_id.id,
          event_title: a.event_id.title,
          event_from_date: a.event_id.from_date,
          event_to_date: a.event_id.to_date,
          event_from_time: a.event_id.from_time,
          event_to_time: a.event_id.to_time,
          event_type_id: a.event_type_id?.id,
          event_type: a.event_type_id?.name,
          event_speaker: a.event_id.speaker,
          event_speaker_details: a.event_id.speaker_details,
          event_event_image: a.event_id.image,
          event_paid_or_free: a.event_id.paid_or_free,
          event_reward_id_for_attendees: a.event_id.reward_id_for_attendees?.id,
          event_description: a.event_id.description,
          event_what_you_will_learn: a.event_id.what_you_will_learn,
          event_location: a.event_id.location,
          event_latitude: a.event_id.latitude,
          event_longitude: a.event_id.longitude,
          event_google_map_link: a.event_id.google_map_link,
          event_other_optional: a.event_id.other_optional,
          event_other_optional_2: a.event_id.other_optional_2,
          event_is_accepting_registrations:
            a.event_id.is_accepting_registrations,
          event_event_status: a.event_id.status,
          event_max_attendees: a.event_id.max_attendees,
          event_registration_deadline: a.event_id.registration_deadline,
          event_tags: a.event_id.tags,
          event_whatlearn: a.event_id.whatlearn,
          event_summary: a.event_id.summary,
          event_initial_price: a.event_id.initial_price,
          event_documented_price: a.event_id.documented_price,
          event_early_bird_price: a.event_id.early_bird_price,
          event_late_fee: a.event_id.late_fee,
          event_total_no_of_registrations: a.event_id.total_no_of_registrations,
          event_total_amount_collected: a.event_id.total_amount_collected,
          event_total_amount_remaining: a.event_id.total_amount_remaining,
          event_meeting_Link: a.event_id.meeting_Link,
          event_pdf: a.event_id.pdf,
          event_mode_of_event: a.event_id.mode_of_event,
          event_no_of_registrations: a.event_id.no_of_registrations,
          speaker: a.event_id.speaker,
          speaker_details: a.event_id.speaker_details,
          event_image: a.event_id.image,
          user_id: a.user_id.id,
          user_name: a.user_id.name,
          user_mobile: a.user_id.mobile,
          user_email: a.user_id.email,
        };
      })
    );

    return successWithData(
      `registration of user ${user_id} for ${event_id}`,
      all_regs,
      {
        totalItems,
        totalPages,
        currentPage,
        pageSize,
      }
    );
  }

  public async getRegistrationById(id: string, verifyUser: any) {
    let registration;
    if (verifyUser.user_exist) {
      registration = await this.registrationRepository.findOne({
        where: { id, isActive: true, isDeleted: false, status: "Registered", void: false },
        relations: ["event_id", "user_id", "event_type_id"],
      });
    } else {
      registration = await this.registrationRepository.findOne({
        where: { id, status: "Registered", void: false },
        relations: ["event_id", "user_id", "event_type_id"],
      });
    }

    if (!registration) return errorWithoutData("Registration not found");
    return successWithData("Registration found", registration);
  }

  public async cancelRegistration(
    id: string,
    data: { cancellationReason?: string },
    verifyUser: any
  ) {
    if (verifyUser.admin_exist)
      return errorWithoutData("only user can cancel registration");

    const registration: any = await this.registrationRepository.findOne({
      where: { id, status: "Registered" },
      relations: ["event_id", "user_id", "event_type_id"],
    });

    if (!registration) return errorWithoutData("Registration not found");

    const currentDate = new Date().toISOString().split("T")[0];
    const currentTime = new Date().toTimeString().split(" ")[0];
    if (currentDate >= registration.event_id.from_date) {
      if (currentTime >= registration.event_id.from_time) {
        return errorWithoutData(
          "Cannot cancel registration after event starts"
        );
      }
    }

    const userService = new UserService();

    const user: any = await userService.findUserById(
      verifyUser.user_exist.id,
      verifyUser
    );

    registration.status = "Cancelled";
    registration.cancelled_by = user.data.id;
    registration.cancellation_reason = data.cancellationReason || null;
    registration.cancelled_at = new Date();

    await this.registrationRepository.save(registration);
    await this.eventRepository.update(registration.event_id.id, {
      no_of_registrations: () => `"no_of_registrations" - 1`,
    });

    return successWithoutData("Registration cancelled successfully");
  }

  public async deleteRegistration(id: string, verifyUser: any) {
    if (verifyUser.user_exist) {
      return errorWithoutData("Unauthorized to delete this registration");
    }

    const registration = await this.registrationRepository.findOneBy({ id });

    if (!registration) return errorWithoutData("Registration not found");

    registration.isDeleted = true;
    registration.isActive = false;

    await this.registrationRepository.save(registration);
    return successWithoutData("Registration deleted successfully");
  }

  public async getAllRegistrationsByEventIdUserIdWithattendace(
    event_id: string,
    user_id: string,
    verifyUser: any,
    pageSize: number,
    currentPage: number
  ) {
    let whereCondition = {};
    if (verifyUser.user_exist) {
      whereCondition = { isActive: true, isDeleted: false, void: false };
    }

    if (verifyUser.admin_exist) {
      whereCondition = { isDeleted: false, void: false };
    }

    // Fetch event registrations for the specific user and event
    const [registration, totalItems] =
      await this.registrationRepository.findAndCount({
        where: {
          ...whereCondition,
          user_id: { id: user_id },
          event_id: { id: event_id },
        },
        order: { createdAt: "DESC" },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        relations: ["event_id", "user_id", "event_type_id"],
      });

    // Fetch attended event IDs for the user
    const attendedEvents = await this.attendanceRepository.find({
      where: { user_id: { id: user_id }, event_id: { id: event_id } }, // Check only for this event
      select: ["event_id"],
    });

    const attendedEventIds = new Set(
      attendedEvents.map((attendance) => attendance.event_id.id)
    );

    // Add `attended` flag to each registration
    const registrationsWithAttendance = registration.map((reg) => ({
      ...reg,
      attended: attendedEventIds.has(reg.event_id.id), // Check if user attended the event
    }));

    const totalPages = Math.ceil(totalItems / pageSize);

    return successWithData(
      `All registrations of user ${user_id} for event ${event_id}`,
      registrationsWithAttendance,
      {
        totalItems,
        totalPages,
        currentPage,
        pageSize,
      }
    );
  }
}
