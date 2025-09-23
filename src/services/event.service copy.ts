import { Event } from "../entities/Event";
import { User } from "../entities/User";
import { Admin } from "../entities/Admin";
import { EventType } from "../entities/EventTypes";
import { Reward } from "../entities/Reward";
import { errorWithData, errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { AppDataSource } from "../config/database";
import { MoreThanOrEqual } from "typeorm";
import { Notification } from '../entities/Notification'; // Adjust the import path as necessary
import { NotificationService } from './notification.service';
import { EventRegistration } from '../entities/EventRegistration'
import { PushNotification } from '../entities/PushNotification'
// import { NotificationService } from '../services/notification.service';
import { eventReminderQueue } from '../workers/notification.worker';
import dayjs from 'dayjs';
const notificationService = new NotificationService();

import { LessThan } from 'typeorm';
import { PushNotificationService } from "./pushNotification.service";
import { createTopicNotificationJob } from "../workers/notification.worker";
import { time } from "console";
interface EventParams {
    isActive?: boolean;
    userId?: string;
}
export class EventService {
    private eventRepository = AppDataSource.getRepository(Event);
    private userRepository = AppDataSource.getRepository(User);
    private eventTypeRepository = AppDataSource.getRepository(EventType);
    private rewardRepository = AppDataSource.getRepository(Reward);
    private adminRepository = AppDataSource.getRepository(Admin)
    private registrationRepository = AppDataSource.getRepository(EventRegistration);
    private notificationRepository = AppDataSource.getRepository(Notification);

    private pushNotificationRepository = AppDataSource.getRepository(PushNotification);

    public async getAllEvents(
        isActive?: boolean,
        userId?: string,
        pageSize: number = 10,
        currentPage: number = 1,
        fromDate?: string,
        toDate?: string,
        eventTypeId?: string,
        mode_of_event?: string,
        speaker?: string,
        from_time?: string,
        status?: string,
        paid_or_free?: string,
        to_time?: string

    ) {
        const queryBuilder = this.eventRepository
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.added_by', 'added_by')
            .leftJoinAndSelect('event.event_type_id', 'event_type')
            .leftJoinAndSelect('event.reward_id_for_attendees', 'reward')
            .where('event.isDeleted = :isDeleted', { isDeleted: false });

        if (isActive !== undefined) {
            queryBuilder.andWhere('event.isActive = :isActive', { isActive });
        }
        if (userId) {
            const isAdmin = await this.adminRepository.findOne({ where: { id: userId.trim() } });

            // console.log(isAdmin ? 'User is an admin' : 'User is not an admin');
            if (!isAdmin) {
                queryBuilder.andWhere('event.from_date > :currentDate', { currentDate: new Date() });
            }
        }
        if (fromDate) {
            const formattedDate = new Date(fromDate);
            if (!isNaN(formattedDate.getTime())) {
                queryBuilder.andWhere('event.from_date BETWEEN :startDate AND :endDate', {
                    startDate: formattedDate.toISOString().split('T')[0] + " 00:00:00",
                    endDate: formattedDate.toISOString().split('T')[0] + " 23:59:59"
                });
            }
        }
        if (toDate) {
            const formattedDate = new Date(toDate);
            if (!isNaN(formattedDate.getTime())) {
                queryBuilder.andWhere('event.to_date BETWEEN :startDate AND :endDate', {
                    startDate: formattedDate.toISOString().split('T')[0] + " 00:00:00",
                    endDate: formattedDate.toISOString().split('T')[0] + " 23:59:59"
                });
            }
        }
        // Apply eventTypeId filter if provided
        if (eventTypeId) {
            queryBuilder.andWhere('event.event_type_id = :eventTypeId', { eventTypeId });
        }

        if (mode_of_event) {
            queryBuilder.andWhere('event.mode_of_event = :mode_of_event', { mode_of_event });
        }
        if (speaker) {
            queryBuilder.andWhere('event.speaker = :speaker', { speaker });
        }

        if (from_time) {
            queryBuilder.andWhere('event.from_time = :from_time', { from_time });
        }

        if (status) {
            queryBuilder.andWhere('event.status = :status', { status });
        }

        if (to_time) {
            queryBuilder.andWhere('event.to_time = :to_time', { to_time });
        }
        if (paid_or_free) {
            queryBuilder.andWhere('event.paid_or_free = :paid_or_free', { paid_or_free });
        }

        queryBuilder.orderBy('event.from_date', 'DESC');

        // Apply pagination
        queryBuilder.skip((currentPage - 1) * pageSize).take(pageSize);

        // Execute query and get results
        const [events, totalItems] = await queryBuilder.getManyAndCount();
        const totalPages = Math.ceil(totalItems / pageSize);

        // Transform events into the desired format
        const formattedEvents = events.map(event => ({
            id: event.id,
            title: event.title,
            speaker: event.speaker,
            speaker_details: event.speaker_details,
            from_date: event.from_date,
            to_date: event.to_date,
            from_time: event.from_time,
            to_time: event.to_time,
            paid_or_free: event.paid_or_free,
            description: event.description,
            // what_you_will_learn: event.what_you_will_learn,
            tags: event.tags,
            whatlearn: event.whatlearn,
            summary: event.summary,
            initial_price: event.initial_price,
            documented_price: event.documented_price,
            meeting_Link: event.meeting_Link,
            pdf: event.pdf,
            mode_of_event: event.mode_of_event || "online",
            image: event.image || `http://${process.env.LOCAL_DB_HOST}/uploads/event.jpg`,

            // added_by: event.added_by
            //     ? {
            //         id: event.added_by.id,
            //         isActive: event.added_by.isActive,
            //         isDeleted: event.added_by.isDeleted,
            //         createdAt: event.added_by.createdAt,
            //         updatedAt: event.added_by.updatedAt,
            //         name: event.added_by.name,
            //         mobile: event.added_by.mobile,
            //         email: event.added_by.email,
            //         is_otp_verified: event.added_by.is_otp_verified
            //     }
            //     : null,
            event_type: event.event_type_id
                ? {
                    id: event.event_type_id,
                    name: event.event_type_id.name,
                    sequenceNo: event.event_type_id.sequenceNo,
                    description: event.event_type_id.description
                }
                : null,
            reward_for_attendees: event.reward_id_for_attendees
                ? { id: event.reward_id_for_attendees.id, name: event.reward_id_for_attendees.name, coins: event.reward_id_for_attendees.coins }
                : null,
            location: event.location,
            latitude: event.latitude,
            longitude: event.longitude,
            google_map_link: event.google_map_link,
            max_attendees: event.max_attendees,
            no_of_attendees: event.no_of_attendees,
            registration_deadline: event.registration_deadline,
            early_bird_price: event.early_bird_price,
            late_fee: event.late_fee,
            isActive: event.isActive,
            isDeleted: event.isDeleted,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
            other_optional: event.other_optional,
            other_optional_2: event.other_optional_2,
            is_accepting_registrations: event.is_accepting_registrations,
            status: event.status,
            no_of_registrations: event.no_of_registrations,
            total_amount_collected: event.total_amount_collected,
            total_amount_remaining: event.total_amount_remaining
        }));

        return successWithData("Events fetched successfully", formattedEvents, {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        });
    }
    public async getEventsGroupedByType() {
        const currentDate = new Date(); // Get current timestamp

        // Step 1: Fetch all event types ordered by sequenceNo
        const eventTypes = await this.eventTypeRepository.find({
            select: ["id", "name", "description", "sequenceNo"], // Fetch sequenceNo for ordering
        });

        // ✅ Convert `sequenceNo` to a number and sort
        const sortedEventTypes = eventTypes
            .map(eventType => ({
                ...eventType,
                sequenceNo: parseInt(eventType.sequenceNo) || 0, // Convert `varchar` to number
            }))
            .sort((a, b) => a.sequenceNo - b.sequenceNo); // Sort by sequence number


        // Step 2: Fetch all future events
        const events = await this.eventRepository
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.event_type_id', 'eventType')
            .where('event.isDeleted = :isDeleted', { isDeleted: false })
            .andWhere('event.from_date >= :currentDate', { currentDate }) // Exclude past events
            .andWhere('event.status != :completedStatus', { completedStatus: 'Completed' }) // Exclude completed events
            .andWhere(
                `(event.to_date > :currentDate OR (event.to_date = :currentDate AND event.to_time > :currentTime))`,
                { currentDate, currentTime: currentDate.toTimeString().split(' ')[0] } // Compare date and time
            )
            .orderBy('eventType.sequenceNo', 'ASC') // Order by sequenceNo
            .addOrderBy('event.from_date', 'ASC')
            .getMany();


        // Step 3: Initialize grouped events with all event types in sequence order
        const groupedEvents: {
            id: string;
            name: string;
            description: string;
            sequenceNo: number;
            events: Event[]
        }[] = sortedEventTypes.map(eventType => ({
            id: eventType.id, // ✅ Keep `id` as a string
            name: eventType.name,
            description: eventType.description || "No description available",
            sequenceNo: eventType.sequenceNo,
            events: [],
        }));

        // Step 4: Group events under respective event types
        events.forEach(event => {
            const eventType = event.event_type_id;
            if (eventType) {
                const eventGroup = groupedEvents.find(group => group.id === eventType.id); // ✅ Compare `id` as string
                if (eventGroup && eventGroup.events.length < 10) {
                    eventGroup.events.push(event); // ✅ No more `never[]` error
                }
            }
        });
        const filteredGroupedEvents = groupedEvents
            .filter(eventGroup => eventGroup.events.length > 0) // Remove empty event types
            .map(eventGroup => ({
                ...eventGroup,
                eventCount: eventGroup.events.length, // Add count of events
            }));

        return successWithData("Events grouped by event type", filteredGroupedEvents);
    }
    // public async findEventsByType(eventTypeId: string, pageSize: number = 50, currentPage: number = 1) {
    //     const [events, totalItems] = await this.eventRepository.findAndCount({
    //         where: { event_type_id: { id: eventTypeId } } as FindOptionsWhere<Event>,
    //         relations: ["event_type_id"], // Ensuring the related EventType is fetched
    //         take: pageSize, // Limit results per page
    //         skip: (currentPage - 1) * pageSize, // Skip for pagination
    //         order: { from_date: "ASC" } // Sorting by from_date in ascending order
    //     });

    //     if (!events || events.length === 0) {
    //         return errorWithoutData("No events found for this type");
    //     }

    //     // Format response
    //     const totalPages = Math.ceil(totalItems / pageSize);

    //     return successWithData("Events fetched successfully", events, {
    //         totalItems,
    //         totalPages,
    //         currentPage,
    //         pageSize
    //     });
    // }


    public async findEventsByType(eventTypeId: string, pageSize: number = 50, currentPage: number = 1) {
        const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
        const currentTime = new Date().toTimeString().split(' ')[0]; // Get current time in HH:MM:SS format

        const queryBuilder = this.eventRepository.createQueryBuilder("event")
            .leftJoinAndSelect("event.event_type_id", "event_type") // Join event_type_id relation
            .where("event.event_type_id = :eventTypeId", { eventTypeId })
            .andWhere("event.isDeleted = :isDeleted", { isDeleted: false }) // Exclude deleted events
            .andWhere("event.status != :completedStatus", { completedStatus: "Completed" }) // Exclude completed events

            .orderBy("event.from_date", "ASC") // Sort by event start date
            .skip((currentPage - 1) * pageSize) // Pagination: Skip previous pages
            .take(pageSize); // Pagination: Limit per page

        const [events, totalItems] = await queryBuilder.getManyAndCount();

        if (!events || events.length === 0) {
            return errorWithoutData("No events found for this type");
        }

        // Calculate total pages
        const totalPages = Math.ceil(totalItems / pageSize);

        return successWithData("Events fetched successfully", events, {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        });
    }


    public async getAllupcomingEvents(pageSize: number, currentPage: number) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of the day

        const [events, total] = await this.eventRepository.findAndCount({
            where: {
                isDeleted: false,
                isActive: true,
                from_date: MoreThanOrEqual(today), // Exclude past events
            },
            relations: ["event_type_id"], // Include event type details
            order: { from_date: "ASC" }, // Sort by from_date in ascending order
            skip: (currentPage - 1) * pageSize, // Pagination: Skip previous records
            take: pageSize, // Limit records per page
        });

        return successWithData("Events fetched successfully", {
            events,
            total,
            currentPage,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    }


    public async findEventById(id: string) {
        const event = await this.eventRepository.findOne({
            where: { id },
            relations: ["event_type_id"], // Include event type details
        });

        if (!event) {
            return errorWithoutData("Event not found");
        }

        return successWithData("Event found", event);
    }


    public async createEvent(data: Partial<Event>, userId?: string) {
        // ✅ Validate `added_by`
        if (!userId) {
            return errorWithoutData("User ID is required");
        }

        const userExists = await this.adminRepository.findOneBy({
            id: String(userId).trim(),
            isDeleted: false,
            isActive: true
        });

        if (!userExists) {
            return errorWithoutData("Only Admin can create event");
        }

        data.added_by = userExists;
        // ✅ Validate `event_type_id`
        if ("event_type_id" in data && typeof data.event_type_id === "string") {
            const eventTypeExists = await this.eventTypeRepository.findOneBy({
                id: String(data.event_type_id).trim(),
                isDeleted: false,
                isActive: true
            });

            if (!eventTypeExists) {
                return errorWithoutData("Event type does not exist");
            }

            data.event_type_id = eventTypeExists; // ✅ Correct way to assign the EventType entity
        }
        const existingEvent = await this.eventRepository.findOne({
            where: {
                title: data.title, // Trim to avoid whitespace issues
                event_type_id: { id: String(data.event_type_id?.id) }, // Reference to the EventType object
                isDeleted: false // Ensure we're not checking deleted events
            }
        });


        if (existingEvent) {
            return errorWithoutData("An event with this name already exists for the same event type.");
        }

        // ✅ Validate `reward_id_for_attendees`
        if ("reward_id_for_attendees" in data && typeof data.reward_id_for_attendees === "string") {
            const rewardExists = await this.rewardRepository.findOneBy({
                id: String(data.reward_id_for_attendees).trim(),
                isDeleted: false,
                isActive: true
            });
            if (!rewardExists) {
                return errorWithoutData("Reward does not exist");
            }
            data.reward_id_for_attendees = rewardExists;
        }

        // ✅ Validate Dates
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Remove time for accurate date comparison

        // Check `from_date`
        if (!data.from_date) {
            return errorWithoutData("From date is required");
        }
        const fromDate = new Date(data.from_date);
        if (isNaN(fromDate.getTime())) {
            return errorWithoutData("Invalid from date format");
        }
        if (fromDate < today) {
            return errorWithoutData("From date cannot be in the past");
        }

        // Check `to_date`
        if (!data.to_date) {
            return errorWithoutData("To date is required");
        }
        const toDate = new Date(data.to_date);
        if (isNaN(toDate.getTime())) {
            return errorWithoutData("Invalid to date format");
        }
        if (toDate < fromDate) {
            return errorWithoutData("To date must be the same or greater than from date");
        }
        if (fromDate.getTime() === toDate.getTime()) {
            if (!data.from_time || !data.to_time) {
                return errorWithoutData("From time and To time are required when dates are the same");
            }
            const fromTime = new Date(`1970-01-01T${data.from_time}`);
            const toTime = new Date(`1970-01-01T${data.to_time}`);

            if (isNaN(fromTime.getTime()) || isNaN(toTime.getTime())) {
                return errorWithoutData("Invalid time format");
            }

            if (fromTime > toTime) {
                return errorWithoutData("From time must be less than or equal to To time when both dates are the same");
            }
            const currentTime = new Date();
            const currentTimeFormatted = new Date(`1970-01-01T${currentTime.toISOString().substring(11, 19)}Z`);

            // if (fromTime < currentTimeFormatted) {
            //     return errorWithoutData("From time cannot be in the past");
            // }
        }

        // ✅ Create and save event
        const newEvent = this.eventRepository.create(data);

        try {
            const savedEvent = await this.eventRepository.save(newEvent);

            // ✅ Send Only One Global Notification
            const dayjs = require('dayjs');
            const utc = require('dayjs/plugin/utc');
            const timezone = require('dayjs/plugin/timezone');

            dayjs.extend(utc);
            dayjs.extend(timezone);

            // Always convert everything to IST timezone
            const IST = 'Asia/Kolkata';

            // Combine date and time from savedEvent, and convert to IST
            const eventDateTime = dayjs.tz(`${savedEvent.from_date} ${savedEvent.from_time}`, IST);

            // Current time in IST
            const now = dayjs().tz(IST);

            // Calculate difference
            const diffInDays = eventDateTime.diff(now, 'day');

            // Use same format for both
            console.log("📅 Event datetime:", eventDateTime.format()); // or .toISOString() if you prefer
            console.log("🕒 Current datetime:", now.format());
            console.log("📊 Days until event:", diffInDays);


            const notificationcategory = 'event_created';
            console.log("📢 Notification category set:", notificationcategory);


            await notificationService.sendNotificationevent(
                savedEvent.id,
                `New event "${savedEvent.title}" has been created!`,
                "both",
                notificationcategory
            );

            console.log("⏳ Scheduling event notifications...");
            await notificationService.scheduleEventNotifications(
                savedEvent.id,
                savedEvent.title,
                savedEvent.event_start_time_utc
            );
            //console.error("🔁 scheduleEventNotifications failed", err);

            // const now = dayjs();
            // const diffInDays = eventDateTime.diff(now, 'day');
            // console.log("📅 Event datetime:", eventDateTime.format());
            // console.log("🕒 Current datetime:", now.format());
            // console.log("📊 Days until event:", diffInDays);

            const reminders: { time: dayjs.Dayjs, message: string }[] = [];

            if (diffInDays === 0 || diffInDays <= 2) {
                console.log("⚠️ Event is soon — within 2 days.");
                reminders.push({
                    time: eventDateTime.subtract(1, 'minute'),
                    message: `🔔 Your event "${savedEvent.title}" is starting in 1 minute`
                });
                reminders.push({
                    time: eventDateTime.subtract(2, 'minute'),
                    message: `🔔 Your event "${savedEvent.title}" is starting in 3 minute`
                });
                reminders.push({
                    time: eventDateTime.subtract(3, 'minute'),
                    message: `🔔 Your event "${savedEvent.title}" is starting in 3 minute`
                });
                reminders.push({
                    time: eventDateTime.subtract(1, 'hour'),
                    message: `🔔 Your event "${savedEvent.title}" is starting in 1 hour`
                });
                reminders.push({
                    time: eventDateTime.subtract(2, 'hour'),
                    message: `🔔 Your event "${savedEvent.title}" is starting in 2 hour`
                });
            } else if (diffInDays < 7) {
                console.log("📆 Event is within a week.");
                reminders.push({
                    time: eventDateTime.subtract(2, 'day'),
                    message: `🔔 Your event "${savedEvent.title}" is in 2 days`
                });
                reminders.push({
                    time: eventDateTime.subtract(1, 'day'),
                    message: `🔔 Your event "${savedEvent.title}" is tomorrow`
                });
                reminders.push({
                    time: eventDateTime.subtract(1, 'hour'),
                    message: `🔔 Your event "${savedEvent.title}" is starting in 1 hour`
                });
            } else {
                console.log("🗓️ Event is more than a week away.");
                reminders.push({
                    time: eventDateTime.subtract(7, 'day'),
                    message: `🔔 Reminder: Your event "${savedEvent.title}" is in 7 days`
                });
                reminders.push({
                    time: eventDateTime.subtract(2, 'day'),
                    message: `🔔 Reminder: Your event "${savedEvent.title}" is in 2 days`
                });
                reminders.push({
                    time: eventDateTime.subtract(1, 'day'),
                    message: `🔔 Reminder: Your event "${savedEvent.title}" is tomorrow`
                });
                reminders.push({
                    time: eventDateTime.subtract(1, 'hour'),
                    message: `🔔 Your event "${savedEvent.title}" is starting in 1 hour`
                });
            }

            console.log("🧮 Total reminders to schedule:", reminders.length);

            // 🔁 Add jobs in BullMQ queue
            for (const reminder of reminders) {
                const delay = reminder.time.diff(dayjs(), 'millisecond');
                console.log(`⏱️ Calculated delay for reminder "${reminder.message}": ${delay} ms`);

                if (delay > 0) {

                    console.log("📌 Adding reminder to queue:", reminder.message);
                    await eventReminderQueue.add('event-reminder', {
                        eventId: savedEvent.id,
                        message: reminder.message,
                    }, {
                        delay,
                    });
                    console.log("✅ Reminder added to queue:", reminder.message);
                } else {
                    console.log("❎ Skipping past reminder:", reminder.message);
                }
            }

            // Uncomment to send follow-up message after 1 day of event creation
            console.log("📤 Scheduling 1-day follow-up reminder...");
            await eventReminderQueue.add('event-reminder', {
                eventId: savedEvent.id,
                message: `⏳ Hurry! Only few seats left for ${savedEvent.title} Register now!`,
            }, {
                delay: dayjs().add(1, 'day').diff(dayjs(), 'millisecond'),
            });

            console.log("✅ Event created and saved successfully");
            return successWithData("Event created successfully", savedEvent);
        } catch (err) {

            return errorWithData("Error creating event", { error: err });
        }
    }


    public async updateEvent(id: string, data: Partial<Event>, verifyUser: any) {
        if (!verifyUser || verifyUser.user_exist) {
            return errorWithoutData("User is not authorized to update event");
        }

        const event = await this.eventRepository.findOneBy({ id });
        if (!event) {
            return errorWithoutData("Event not found");
        }

        if (event.status === "Completed" && "status" in data) {
            return errorWithoutData("Cannot modify status: Event is already completed.");
        }

        // ✅ Prevent modification of `added_by`
        if ("added_by" in data) {
            delete data.added_by;
        }
        if (event.status === "Completed") {
            return errorWithoutData("Event is completed and cannot be modified.");
        }
        if (event.status === "Completed" && "status" in data) {
            return errorWithoutData("Cannot modify status: Event is already completed.");
        }

        // ✅ Validate and update `event_type_id`
        if ("event_type_id" in data && typeof data.event_type_id === "string") {
            const eventTypeExists = await this.eventTypeRepository.findOneBy({
                id: String(data.event_type_id).trim(),
                isDeleted: false,
                isActive: true
            });

            if (!eventTypeExists) {
                return errorWithoutData("Event type does not exist");
            }

            data.event_type_id = eventTypeExists;
        }

        // ✅ Validate and update `reward_id_for_attendees`
        if ("reward_id_for_attendees" in data && typeof data.reward_id_for_attendees === "string") {
            const rewardExists = await this.rewardRepository.findOneBy({
                id: String(data.reward_id_for_attendees).trim(),
                isDeleted: false,
                isActive: true
            });

            if (!rewardExists) {
                return errorWithoutData("Reward does not exist");
            }

            data.reward_id_for_attendees = rewardExists;
        }

        // ✅ Ensure image & pdf are updated only if new files are provided
        if (!data.image) {
            data.image = event.image; // Keep the existing image if no new file is uploaded
        }
        if (!data.pdf) {
            data.pdf = event.pdf; // Keep the existing PDF if no new file is uploaded
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Remove time for accurate date comparison

        // Check `from_date` (keep existing if not provided)
        const fromDate = data.from_date ? new Date(data.from_date) : new Date(event.from_date);
        if (isNaN(fromDate.getTime())) {
            return errorWithoutData("Invalid from date format");
        }
        if (fromDate < today) {
            return errorWithoutData("From date cannot be in the past");
        }

        // Check `to_date` (keep existing if not provided)
        const toDate = data.to_date ? new Date(data.to_date) : new Date(event.to_date);
        if (isNaN(toDate.getTime())) {
            return errorWithoutData("Invalid to date format");
        }
        if (toDate < fromDate) {
            return errorWithoutData("To date must be the same or greater than from date");
        }

        if (fromDate.getTime() === toDate.getTime()) {
            // Handle time checks only if dates are the same
            const fromTime = data.from_time ? new Date(`1970-01-01T${data.from_time}`) : new Date(`1970-01-01T${event.from_time}`);
            const toTime = data.to_time ? new Date(`1970-01-01T${data.to_time}`) : new Date(`1970-01-01T${event.to_time}`);

            if (isNaN(fromTime.getTime()) || isNaN(toTime.getTime())) {
                return errorWithoutData("Invalid time format");
            }

            if (fromTime > toTime) {
                return errorWithoutData("From time must be less than or equal to To time when both dates are the same");
            }
            const currentTime = new Date();
            const currentTimeFormatted = new Date(`1970-01-01T${currentTime.toISOString().substring(11, 19)}Z`);

            if (fromTime < currentTimeFormatted) {
                return errorWithoutData("From time cannot be in the past");
            }
        }

        let rescheduleNotificationSent = false;
        if (
            ("from_date" in data && data.from_date !== event.from_date) ||
            ("to_date" in data && data.to_date !== event.to_date)
        ) {
            rescheduleNotificationSent = true;

            // ✅ Void previous registrations due to event reschedule
            await this.registrationRepository
                .createQueryBuilder()
                .update()
                .set({ void: true, isDeleted: true }) // Assuming "void" column exists in registration table
                .where("event_id = :eventId AND isDeleted = false AND isActive = true", { eventId: event.id })
                .execute();
        }

        const updatedEvent = await this.eventRepository.save({ id, ...data, no_of_registrations: 0 });

        // ✅ Send Only One Global Notification when `from_date` is updated
        if (rescheduleNotificationSent) {
            try {
                const registrations = await this.registrationRepository.find({
                    where: { event_id: { id: event.id } },
                    relations: ["user_id"], // Ensure user_id is loaded
                });

                if (registrations.length > 0) {
                    const userIds = registrations
                        .filter(reg => reg.user_id && reg.user_id.id) // Ensure user_id exists
                        .map(reg => reg.user_id.id); // Extract user IDs

                    if (userIds.length === 0) {
                        console.warn("⚠️ No valid user IDs found for notifications.");
                        return errorWithoutData("No valid users found to notify.");
                    }

                    const message = `⚠️ The event "${event.title}" rescheduled for ${event.from_date} to ${event.from_time} are you still interested?`;

                    await notificationService.sendNotification(
                        userIds, // Send notifications to all registered users
                        event.id,
                        message,
                        "both", // Send as both In-App & Push
                        false, // Not a global notification
                        "event_reminder"
                    );
                }
            } catch (error) {
                console.error("❌ Notification Error:", error);
            }
        }

        //send the push notification if event is rescheduled and when 'from_date' is updated
        if (rescheduleNotificationSent) {
            const notifs = await this.pushNotificationRepository.delete({ event_id: { id: updatedEvent.id } });
            await notificationService.RescheduledEventNotifications(updatedEvent.id, updatedEvent.title, updatedEvent.event_start_time_utc)
        }

        return successWithoutData("Event updated successfully");
    }


    public async deleteEvent(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData("User cannot delete event");
        }

        const event = await this.eventRepository.findOneBy({ id });

        if (!event) {
            return errorWithoutData("Event not found");
        }

        try {
            // Fetch registered users
            const registrations = await this.registrationRepository.find({
                where: { event_id: { id: event.id } },
                relations: ["user_id"], // Ensure user_id is loaded
            });

            if (registrations.length > 0) {
                await this.notificationRepository.delete({

                    event: { id: event.id }
                });
            }

            if (registrations.length > 0) {
                const userIds = registrations
                    .filter(reg => reg.user_id && reg.user_id.id) // Ensure user_id exists
                    .map(reg => reg.user_id.id); // Extract user IDs

                if (userIds.length === 0) {
                    console.warn("⚠️ No valid user IDs found for notifications.");
                    return errorWithoutData("No valid users found to notify.");
                }

                const message = `⚠️ The event "${event.title}" scheduled for ${event.from_date} has been canceled. Refunds (if applicable) will be processed soon.`;

                await notificationService.sendNotification(
                    userIds, // Send notifications to all registered users
                    event.id,
                    message,
                    "both", // Send as both In-App & Push
                    false, // Not a global notification
                    "event_cancelled"
                );


            }
            const notifs = await this.pushNotificationRepository.delete({ event_id: { id: event.id } });
            console.log(notifs.affected)
            await notificationService.CancelledEventNotifications(event.id, event.title, event.from_date.toString(), event.to_time.toString());


            event.isDeleted = true; // Soft delete the event
            await this.eventRepository.save(event);


            return successWithoutData("Event has been soft deleted successfully");
        } catch (error) {
            console.error("❌ Notification Error:", error);
            return errorWithoutData("Failed to delete event and notify users");
        }
    }



    public async activeEvent(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData("User cannot activate event");
        }

        const event = await this.eventRepository.findOneBy({ id });

        if (!event) {
            return errorWithoutData("Event not found");
        }

        event.isActive = true; // Mark as active
        await this.eventRepository.save(event);

        return successWithoutData("Event activated successfully");
    }


}
