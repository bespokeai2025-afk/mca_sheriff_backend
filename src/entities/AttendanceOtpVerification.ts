    import { Entity, Column, ManyToOne, Check, JoinColumn } from 'typeorm';
    import { User } from './User';
    import { Common } from './Common';
    import { Admin } from './Admin';

    // OTPVerification entity representing OTP verification records
    @Entity('attendance_otp_verifications')
    @Check('todays_count >= 0') // Ensure today's count is non-negative
    @Check('last_try_count >= 0') // Ensure last try count is non-negative
    export class AttendanceOtpVerification extends Common {

        // Relationship with User entity (nullable)
        @ManyToOne(() => User, user => user.id, { nullable: true, onDelete: 'CASCADE' })
        @JoinColumn({ name: "user_id" })
        user_id: User;

        // Relationship with Admin entity (nullable)
        @ManyToOne(() => Admin, admin => admin.id, { nullable: true, onDelete: 'CASCADE' })
        @JoinColumn({ name: "admin_id" })
        admin_id: Admin;

        // OTP value
        @Column({ type: 'varchar', length: 10 })
        otp: string;

        // Expiry time for the OTP
        @Column({ type: 'timestamp' })
        expiry_time: Date;

        // Count of today's OTP requests
        @Column({ type: 'int', default: 0 })
        todays_count: number;

        // Count of last OTP try attempts
        @Column({ type: 'int', default: 0 })
        last_try_count: number;

        // Flag indicating if the OTP is verified
        @Column({ type: 'boolean', default: false })
        is_verified: boolean;

        // Timestamp for the last OTP request
        @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
        last_requested_at: Date;
    }