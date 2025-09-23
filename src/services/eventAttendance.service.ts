import { AppDataSource } from "../config/database";
import { EventAttendance } from "../entities/EventAttendance";
import { Event } from "../entities/Event";
import { Notification } from '../entities/Notification'; // Adjust the import path as necessary
import { errorWithoutData, successWithData, successWithoutData } from "../config/ApiResponse";
import { Admin } from "../entities/Admin";
import { User } from "../entities/User";
import { RewardsHistory } from "../entities/RewardHistory";
import { RewardHistoryService } from "./rewardHistory.service";
import { NotificationService } from "./notification.service";
const notificationService = new NotificationService();

export class EventAttendanceService {
    private attendanceRepository = AppDataSource.getRepository(EventAttendance);
    private eventRepository = AppDataSource.getRepository(Event);
    private userRepository = AppDataSource.getRepository(User)
    private rewardHistoryRepository = AppDataSource.getRepository(RewardsHistory);
    private adminRepository = AppDataSource.getRepository(Admin);
    private notificationRepository = AppDataSource.getRepository(Notification);

    // Get all attendance records
    public async getAllAttendance(verifyUser: any, pageSize: number, currentPage: number) {

        let whereCondition = {};
        if (verifyUser.user_exist) {
            whereCondition = { isActive: true, isDeleted: false };
        }

        if (verifyUser.admin_exist) {
            whereCondition = { isDeleted: false };
        }

        const [attendance, totalItems] = await this.attendanceRepository.findAndCount({
            where: whereCondition,
            order: { createdAt: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
            relations: ["event_id", "user_id", "marked_by", "revoked_by"]
        });

        const totalPages = Math.ceil(totalItems / pageSize);

        const all_atte = await Promise.all(
            attendance.map(async (a) => {
                const event: any = await this.eventRepository.findOne({ where: { id: a.event_id.id }, relations: ['reward_id_for_attendees', 'event_type_id'] });
                return {
                    attendance_id: a.id, rewarded_coins: a.reward_coins, marked_at: a.marked_at, event_id: a.event_id.id, event_title: a.event_id.title, event_from_date: a.event_id.from_date, event_to_date: a.event_id.to_date, event_from_time: a.event_id.from_time, event_to_time: a.event_id.to_time, event_type_id: event.event_type_id.id,
                    event_type: event.event_type_id.name, user_id: a.user_id.id, user_name: a.user_id.name, user_mobile: a.user_id.mobile, user_email: a.user_id.email, marked_by_id: a.marked_by.id, marked_by_name: a.marked_by.name, revoked_by_id: a.revoked_by?.id, revoked_by_name: a.revoked_by?.name,
                    reward_id: event.reward_id_for_attendees.id, reward_name: event.reward_id_for_attendees.name, reward_coins: event.reward_id_for_attendees.coins
                };
            })
        )



        return successWithData("All event attendance records", all_atte, {
            totalItems,
            totalPages,
            currentPage,
            pageSize
        });
    }

    // Get attendance by ID
    public async getAttendanceById(id: string, verifyUser: any) {

        let attendance = null;
        if (verifyUser.admin_exist) {

            attendance = await this.attendanceRepository.findOne({ where: { id }, relations: ["event_id", "user_id", "marked_by", "revoked_by"] });
        } else {

            attendance = await this.attendanceRepository.findOne({ where: { id, isActive: true, isDeleted: false }, relations: ["event_id", "user_id", "marked_by", "revoked_by"] });
        }

        if (!attendance) return errorWithoutData("Attendance record not found");

        const event: any = await this.eventRepository.findOne({ where: { id: attendance.event_id.id }, relations: ['reward_id_for_attendees', 'event_type_id'] });

        const all_atte =

        {
            attendance_id: attendance.id,
            rewarded_coins: attendance.reward_coins,
            marked_at: attendance.marked_at,
            event_id: attendance.event_id.id,
            event_title: attendance.event_id.title,
            event_from_date: attendance.event_id.from_date,
            event_to_date: attendance.event_id.to_date,
            event_from_time: attendance.event_id.from_time,
            event_to_time: attendance.event_id.to_time,
            event_type_id: event.event_type_id.id,
            event_type: event.event_type_id.name,
            user_id: attendance.user_id.id,
            user_name: attendance.user_id.name,
            user_mobile: attendance.user_id.mobile,
            user_email: attendance.user_id.email,
            marked_by_id: attendance.marked_by.id,
            marked_by_name: attendance.marked_by.name,
            revoked_by_id: attendance.revoked_by?.id,
            revoked_by_name: attendance.revoked_by?.name,
            reward_id: event.reward_id_for_attendees.id,
            reward_name: event.reward_id_for_attendees.name,
            reward_coins: event.reward_id_for_attendees.coins
        }



        return successWithData("Attendance record found", all_atte);
    }

    // public async getAttendanceByEventId(id: string, verifyUser: any) {

    //     if (verifyUser.user_exist) return errorWithoutData("only admin can use this service");
    //     const event = await this.eventRepository.findOne({ where: { id }, relations: ['reward_id_for_attendees', 'event_type_id'] });
    //     if (!event) return errorWithoutData("event not found");
    //     // Check if attendance is being marked on the correct date
    //     const currentDate = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    //     const eventDate = event.from_date.toISOString().split('T')[0]; // Convert event date to the same format

    //     if (currentDate !== eventDate) {
    //         return errorWithoutData("Attendance can only be marked on the event day");
    //     }

    //     let attendance = null;
    //     if (verifyUser.admin_exist) {

    //         attendance = await this.attendanceRepository.find({ where: { event_id: { id: id } }, relations: ["event_id", "user_id", "marked_by", "revoked_by"] });
    //     }
    //     if (!attendance) return errorWithoutData("Attendance record not found");



    //     const all_atte = await Promise.all(
    //         attendance.map(async (a) => {
    //             return {
    //                 attendance_id: a.id, rewarded_coins: a.reward_coins, marked_at: a.marked_at, event_id: a.event_id.id, event_title: a.event_id.title, event_from_date: a.event_id.from_date, event_to_date: a.event_id.to_date, event_from_time: a.event_id.from_time, event_to_time: a.event_id.to_time, event_type_id: event.event_type_id.id,
    //                 event_type: event.event_type_id.name, user_id: a.user_id.id, user_name: a.user_id.name, user_mobile: a.user_id.mobile, user_email: a.user_id.email, marked_by_id: a.marked_by.id, marked_by_name: a.marked_by.name, revoked_by_id: a.revoked_by?.id, revoked_by_name: a.revoked_by?.name, reward_id: event.reward_id_for_attendees.id, reward_name: event.reward_id_for_attendees.name, reward_coins: event.reward_id_for_attendees.coins
    //             };
    //         })
    //     )
    //     return successWithData("Attendance record found", all_atte);
    // }

    public async getAttendanceByEventId(id: string, verifyUser: any) {
        try {
            console.log("getAttendanceByEventId called with id:", id, "verifyUser:", verifyUser);

            if (verifyUser.user_exist) {
                console.log("Unauthorized access attempt by non-admin user");
                return errorWithoutData("Only admin can use this service");
            }

            const event = await this.eventRepository.findOne({
                where: { id },
                relations: ['reward_id_for_attendees', 'event_type_id']
            });

            if (!event) {
                console.log("Event not found for id:", id);
                return errorWithoutData("Event not found");
            }

            // const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            // const eventDate = new Date(event.from_date).toISOString().split('T')[0];

            // const currentDate = new Date().toISOString().split('T')[0];
            // const eventDate = event.from_date.toISOString().split('T')[0];
            // console.log("Current Date:", currentDate, "Event Date:", eventDate);

            // if (currentDate >= eventDate) {
            //     console.log("Attendance attempt on incorrect date");
            //     return errorWithoutData("Attendance can only be marked on the event day");
            // }

            let attendance = null;
            if (verifyUser.admin_exist) {
                attendance = await this.attendanceRepository.find({
                    where: { event_id: { id: id } },
                    relations: ["event_id", "user_id", "marked_by", "revoked_by"]
                });
            }

            if (!attendance || attendance.length === 0) {
                console.log("No attendance record found for event id:", id);
                return errorWithoutData("Attendance record not found");
            }

            console.log("Attendance records found:", attendance.length);

            const all_atte = await Promise.all(
                attendance.map(async (a) => {
                    return {
                        attendance_id: a.id,
                        rewarded_coins: a.reward_coins,
                        marked_at: a.marked_at,
                        event_id: a.event_id.id,
                        event_title: a.event_id.title,
                        event_from_date: a.event_id.from_date,
                        event_to_date: a.event_id.to_date,
                        event_from_time: a.event_id.from_time,
                        event_to_time: a.event_id.to_time,
                        event_type_id: event.event_type_id.id,
                        event_type: event.event_type_id.name,
                        user_id: a.user_id.id,
                        user_name: a.user_id.name,
                        user_mobile: a.user_id.mobile,
                        user_email: a.user_id.email,
                        marked_by_id: a.marked_by.id,
                        marked_by_name: a.marked_by.name,
                        revoked_by_id: a.revoked_by?.id,
                        revoked_by_name: a.revoked_by?.name,
                        reward_id: event.reward_id_for_attendees?.id ?? "null",
                        reward_name: event.reward_id_for_attendees?.name ?? "null",
                        reward_coins: event.reward_id_for_attendees?.coins ?? "null"
                    };
                })
            );

            console.log("Returning attendance records:", all_atte);
            return successWithData("Attendance record found", all_atte);
        } catch (error) {
            console.error("Error in getAttendanceByEventId:", error);
            return errorWithoutData("An unexpected error occurred");
        }
    }


    public async getAttendanceByUserId(id: string, verifyUser: any) {

        if (verifyUser.user_exist) return errorWithoutData("only admin can use this service");
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) return errorWithoutData("user not found");

        let attendance = null;
        if (verifyUser.admin_exist) {

            attendance = await this.attendanceRepository.find({ where: { user_id: { id: id } }, relations: ["event_id", "user_id", "marked_by", "revoked_by"] });
        }
        if (!attendance) return errorWithoutData("Attendance record not found");


        const all_atte = await Promise.all(
            attendance.map(async (a) => {
                const event: any = await this.eventRepository.findOne({ where: { id: a.event_id.id }, relations: ['reward_id_for_attendees', 'event_type_id'] });

                const {
                    id: attendance_id,
                    reward_coins,
                    marked_at,
                    event_id,
                    user_id,
                    ...rest
                } = a;

                return {
                    attendance_id: a.id, rewarded_coins: a.reward_coins, marked_at: a.marked_at, event_id: a.event_id.id, event_title: a.event_id.title, event_from_date: a.event_id.from_date, event_to_date: a.event_id.to_date, event_from_time: a.event_id.from_time, event_to_time: a.event_id.to_time, event_type_id: event.event_type_id.id,
                    event_type: event.event_type_id.name, user_id: a.user_id.id, user_name: a.user_id.name, user_mobile: a.user_id.mobile, user_email: a.user_id.email, marked_by_id: a.marked_by.id, marked_by_name: a.marked_by.name, revoked_by_id: a.revoked_by?.id, revoked_by_name: a.revoked_by?.name, reward_id: event.reward_id_for_attendees.id, reward_name: event.reward_id_for_attendees.name, reward_coins: event.reward_id_for_attendees.coins,
                    ...rest,
                    "test": "hello"
                };
            })
        )
        return successWithData("Attendance record found", all_atte);
    }

    public async getAttendanceByEventIdByUserId(event_id: string, user_id: string, verifyUser: any) {

        const event = await this.eventRepository.findOne({ where: { id: event_id }, relations: ['reward_id_for_attendees', 'event_type_id'] });
        if (!event) return errorWithoutData("event not found");

        const user = await this.userRepository.findOne({ where: { id: user_id } });
        if (!user) return errorWithoutData("user not found");

        let attendance = null;

        attendance = await this.attendanceRepository.findOne({ where: { event_id: { id: event_id }, user_id: { id: user_id } }, relations: ["event_id", "user_id", "marked_by", "revoked_by"] });

        if (!attendance) return errorWithoutData("Attendance record not found");

        const all_atte =
        {
            attendance_id: attendance.id, rewarded_coins: attendance.reward_coins, marked_at: attendance.marked_at, event_id: attendance.event_id.id, event_title: attendance.event_id.title, event_from_date: attendance.event_id.from_date, event_to_date: attendance.event_id.to_date, event_from_time: attendance.event_id.from_time, event_to_time: attendance.event_id.to_time, event_type_id: event.event_type_id.id, event_type: event.event_type_id.name, user_id: attendance.user_id.id, user_name: attendance.user_id.name, user_mobile: attendance.user_id.mobile, user_email: attendance.user_id.email, marked_by_id: attendance.marked_by.id, marked_by_name: attendance.marked_by.name, revoked_by_id: attendance.revoked_by?.id, revoked_by_name: attendance.revoked_by?.name, reward_id: event.reward_id_for_attendees.id, reward_name: event.reward_id_for_attendees.name, reward_coins: event.reward_id_for_attendees.coins
        }

        return successWithData("Attendance record found", all_atte);
    }

    // Mark attendance
    // public async markAttendance(data: { event_id: string; user_id: string; marked_by: string; reward_coins?: number }, verifyUser: any) {

    //     if (verifyUser.user_exist) {
    //         return errorWithoutData("user can't mark attendance")
    //     }

    //     const eventAttendance = await this.attendanceRepository.findOne({ where: { user_id: { id: data.user_id }, event_id: { id: data.event_id } } },);


    //     if (eventAttendance) return errorWithoutData("attendance is already marked")

    //     const event = await this.eventRepository.findOne({ where: { id: data.event_id }, relations: ['reward_id_for_attendees'] },);
    //     const user = await this.userRepository.findOneBy({ id: data.user_id });
    //     const markedBy = await this.adminRepository.findOneBy({ id: data.marked_by });

    //     if (!event || !user || !markedBy) return errorWithoutData("Invalid event, user, or marker");

    //     const is_attendance_marked = await this.attendanceRepository.findOne({ where: { event_id: { id: event.id }, user_id: { id: user.id } } })

    //     if (is_attendance_marked) return errorWithoutData("attendance is already marked");

    //     const attendance = this.attendanceRepository.create({
    //         event_id: { id: event.id },
    //         user_id: { id: user.id },
    //         marked_by: { id: markedBy.id },
    //         reward_coins: event.reward_id_for_attendees.coins,
    //     });



    //     const new_reward_history = await this.rewardHistoryRepository.create({
    //         user_id: { id: user.id },
    //         event_id: { id: event.id },
    //         transaction_type: "Earned",
    //         amount: event.reward_id_for_attendees.coins,
    //         reward_type: "event",
    //         description: "Event Attendance Coins added"
    //     })
    //     await this.rewardHistoryRepository.save(new_reward_history)

    //     await this.userRepository.update({ id: user.id }, { coins: user.coins + event.reward_id_for_attendees.coins })

    //     const new_attendance = await this.attendanceRepository.save(attendance);

    //     return successWithData("Attendance marked successfully", new_attendance);
    // }

    public async markAttendance(
        data: { event_id: string; user_id: string; marked_by: string; reward_coins?: number },
        verifyUser: any
    ) {
        const queryRunner = AppDataSource.createQueryRunner();
        const { user_id, event_id, marked_by } = data;

        try {
            // ✅ Step 1: Check if user already exists
            console.log(`🔍 Step 1 [User: ${user_id}, Event: ${event_id}]: Checking if user already marked attendance...`);
            if (verifyUser.user_exist) {
                console.log(`⚠️ Step 1 [User: ${user_id}, Event: ${event_id}]: User already marked attendance.`);
                return errorWithoutData("User already marked attendance");
            }

            // ✅ Step 2: Check if attendance is already marked
            console.log(`🔍 Step 2 [User: ${user_id}, Event: ${event_id}]: Checking existing attendance in the database...`);
            const eventAttendance = await this.attendanceRepository.findOne({
                where: {
                    user_id: { id: user_id },
                    event_id: { id: event_id }
                }
            });

            if (eventAttendance) {
                console.log(`⚠️ Step 2 [User: ${user_id}, Event: ${event_id}]: Attendance already marked in DB.`);
                return errorWithoutData("Attendance is already marked");
            }

            // ✅ Step 3: Fetch Event, User, and Marker
            console.log(`📦 Step 3 [User: ${user_id}, Event: ${event_id}]: Fetching event, user, and marker details...`);
            const [event, user, markedBy] = await Promise.all([
                this.eventRepository.findOne({ where: { id: event_id }, relations: ['reward_id_for_attendees'] }),
                this.userRepository.findOneBy({ id: user_id }),
                this.adminRepository.findOneBy({ id: marked_by })
            ]);

            if (!event) console.log(`❌ Step 3: Event not found with ID: ${event_id}`);
            if (!user) console.log(`❌ Step 3: User not found with ID: ${user_id}`);
            if (!markedBy) console.log(`❌ Step 3: Marker not found with ID: ${marked_by}`);

            if (!event || !user || !markedBy) {
                console.log(`❌ Step 3 [User: ${user_id}, Event: ${event_id}]: Invalid event, user, or marker.`);
                return errorWithoutData("Invalid event, user, or marker");
            }

            // ✅ Step 4: Mark Attendance
            console.log(`📝 Step 4 [User: ${user_id}, Event: ${event_id}]: Creating new attendance entry...`);
            const attendance = this.attendanceRepository.create({
                event_id: { id: event.id },
                user_id: { id: user.id },
                marked_by: { id: markedBy.id },
                reward_coins: event.reward_id_for_attendees ? event.reward_id_for_attendees.coins : 0
            });

            const newAttendance = await this.attendanceRepository.save(attendance);
            console.log(`✅ Step 4 [User: ${user_id}, Event: ${event_id}]: Attendance saved to DB.`);

            // ✅ Step 5: Add Reward Coins
            if (event.reward_id_for_attendees) {
                const rewardCoins = event.reward_id_for_attendees.coins || 0;
                console.log(`💰 Step 5 [User: ${user_id}, Event: ${event_id}]: Adding reward coins: ${rewardCoins}`);

                const newRewardHistory = this.rewardHistoryRepository.create({
                    user_id: { id: user.id },
                    event_id: { id: event.id },
                    transaction_type: "Earned",
                    amount: rewardCoins,
                    reward_type: "event",
                    description: "Event Attendance Coins added"
                });

                await queryRunner.manager.update(this.eventRepository.target, event.id, {
                    no_of_attendees: event.no_of_attendees + 1,
                });
                console.log(`📈 Step 5 [Event: ${event_id}]: Event attendee count updated.`);

                await this.rewardHistoryRepository.save(newRewardHistory);
                await this.userRepository.update({ id: user.id }, { coins: user.coins + rewardCoins });
                console.log(`🎉 Step 5 [User: ${user_id}]: User coin balance updated.`);

                // ✅ Step 6: Send Notification after reward
                console.log(`📲 Step 6 [User: ${user_id}, Event: ${event_id}]: Sending reward notification...`);
                await notificationService.sendRewardNotification(
                    user.id,
                    event.id,
                    `🎉 You've ${event.reward_id_for_attendees.coins} earned coins for attending the event.`
                );
            }

            // ✅ Step 7: Delete related notifications
            console.log(`🗑️ Step 7 [User: ${user_id}, Event: ${event_id}]: Deleting related event notifications...`);
            await this.notificationRepository.delete({
                event: { id: event.id }
            });

            // ✅ Final Step: Return success response
            console.log(`✅ Final Step [User: ${user_id}, Event: ${event_id}]: Attendance marking process completed.`);
            return successWithData("Attendance marked successfully", newAttendance);

        } catch (error) {
            console.error(`❌ Error [User: ${data.user_id}, Event: ${data.event_id}]:`, error);
            return errorWithoutData("Something went wrong");
        }
    }



    // Update attendance
    public async updateAttendance(id: string, data: Partial<EventAttendance>, verifyUser: any) {

        if (verifyUser.user_exist) {
            return errorWithoutData("user cann't update attendance")
        }
        const attendance = await this.attendanceRepository.findOne({ where: { id } });
        if (!attendance) return errorWithoutData("Attendance record not found");

        await this.attendanceRepository.update(id, data);
        return successWithoutData("Attendance updated successfully");
    }

    // Revoke attendance
    public async revokeAttendance(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData("user can't update attendance")
        }
        const attendance = await this.attendanceRepository.findOne({ where: { id, revoked: false }, relations: ["event_id", "user_id", "marked_by", "revoked_by"] });

        if (!attendance) return errorWithoutData("Attendance record not found");

        const revoker = await this.adminRepository.findOneBy({ id: verifyUser.admin_exist.id });
        if (!revoker) return errorWithoutData("Invalid revoker");

        attendance.revoked = true;
        attendance.revoked_by = revoker;
        attendance.revoked_at =new Date();

        // console.log(attendance)

        const reward: any = await this.rewardHistoryRepository.findOneBy({ user_id: { id: attendance.user_id.id }, event_id: { id: attendance.event_id.id } })

        console.log(reward)
        // console.log(reward)
        const rewardHistoryService = new RewardHistoryService();

        await rewardHistoryService.deleteRewardHistory(reward.id, verifyUser)

        await this.userRepository.update({ id: attendance.user_id.id }, { coins: attendance.user_id.coins - reward.amount })

        await this.attendanceRepository.save(attendance);
        return successWithoutData("Attendance revoked successfully");
    }

    // Delete attendance
    public async deleteAttendance(id: string, verifyUser: any) {
        if (verifyUser.user_exist) {
            return errorWithoutData("user cann't update attendance")
        }
        const attendance = await this.attendanceRepository.findOneBy({ id });
        if (!attendance) return errorWithoutData("Attendance record not found");

        attendance.isDeleted = true;
        attendance.isActive = false;


        await this.attendanceRepository.save(attendance);
        return successWithoutData("Attendance record deleted successfully");
    }
}
