import { Entity, Column, OneToMany, OneToOne } from "typeorm";
import { Common } from "./Common";
import { RefreshToken } from "./RefreshToken";
import { OTPVerification } from "./OtpVerification";
import { UserReferralCode } from "./UserReferralCode";
// import { RewardsHistory } from "./RewardHistory";
// import { EventAttendance } from "./EventAttendance";
import { EmailVerification } from "./EmailVerification";
// import { Feedback } from "./Feedback";
// import { EventRegistration } from "./EventRegistration";
// import { Notification } from "./Notification";
// import { NotificationReadReceipt } from "./NotificationReadReceipt";
// import { PushNotification } from "./PushNotification";
import { DeviceToken } from "./DeviceToken";

// User entity representing users in the system
@Entity()
export class User extends Common {

    // Name of the user
    @Column({ type: "varchar", length: 255, nullable: true })
    name: string;

    // Mobile number of the user (unique)
    @Column({ type: "varchar", length: 15 })
    mobile: string;

    // Email of the user (unique)
    @Column({ type: "varchar", length: 255, nullable: true })
    email: string;

    // Flag indicating if the OTP is verified
    @Column({ type: "boolean", default: false })
    is_otp_verified: boolean;

    // Flag indicating if the Email is verified
    @Column({ type: "boolean", default: false })
    is_email_verified: boolean;

    // Flag indicating if the Email is verified
    @Column({ type: "boolean", default: false })
    is_answer_submitted: boolean;

    // Flag indicating if the Email is verified
    @Column({ type: "boolean", default: false })
    is_survey_submitted: boolean;


    // Flag indicating if the Email is verified
    @Column({ type: "boolean", default: false })
    is_feedback_submitted: boolean;

    // Number of coins the user has
    @Column({ type: "int", default: 0 })
    coins: number;

    // Password of the user
    @Column({ type: "varchar", length: 255, nullable: true })
    password: string;

    // Flag indicating if the user's profile is completed
    @Column({ type: "boolean", default: false })
    isProfileCompleted: boolean;
    @Column({ type: "boolean", default: false })
    survey: boolean;
    // Flag indicating if the user's joining reward claim is completed
    @Column({ type: "boolean", default: false })
    isJoiningRewardClaimed: boolean;

    // Relationship with RefreshToken entity
    @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.id)
    refreshTokens: RefreshToken[];

    // Relationship with OTPVerification entity
    @OneToMany(() => OTPVerification, (otpVerification) => otpVerification.id)
    otpVerification: OTPVerification;

    // Relationship with UserReferralCode entity
    @OneToOne(() => UserReferralCode)
    userReferralCode: UserReferralCode;

    // @OneToMany(() => Feedback, (feedback) => feedback.id)
    // feedback: Feedback;

    // Relationship with RewardsHistory entity
    // @OneToMany(() => RewardsHistory, (rewardHistory) => rewardHistory.id)
    // rewardHistory: RewardsHistory[];

    // Relationship with RewardsHistory entity
    // @OneToMany(() => RewardsHistory, (referralrewardHistory) => referralrewardHistory.id)
    // referralrewardHistory: RewardsHistory[];


    // Relationship with RewardsHistory entity
    // @OneToMany(() => RewardsHistory, (referrerRewardHistory) => referrerRewardHistory.id)
    // referrerRewardHistory: RewardsHistory[];

    // Relationship with EventAttendance entity
    // @OneToMany(() => EventAttendance, (eventAttendance) => eventAttendance.id)
    // eventAttendance: EventAttendance;

    // Relationship with EventAttendance entity
    // @OneToMany(() => EventRegistration, (eventRegistration) => eventRegistration.id)
    // eventRegistration: EventRegistration;

    // Relationship with EventAttendance entity
    // @OneToMany(() => EventRegistration, (eventRegistrationCancel) => eventRegistrationCancel.id)
    // eventRegistrationCancel: EventRegistration;

    // Relationship with EventAttendance entity
    @OneToMany(() => EmailVerification, (emailVerification) => emailVerification.id)
    emailVerification: EmailVerification;
    // 
    // Relationship with OTPVerification entity
    // @OneToMany(() => Notification, (notification) => notification.id)
    // notification: Notification;

    // Relationship with OTPVerification entity
    // @OneToMany(() => NotificationReadReceipt, (readReceipts) => readReceipts.id)
    // readReceipts: NotificationReadReceipt;

    // Relationship with OTPVerification entity
    // @OneToMany(() => PushNotification, (pushNotifications) => pushNotifications.id)
    // pushNotifications: PushNotification;

    // Relationship with OTPVerification entity
    @OneToMany(() => DeviceToken, (deviceToken) => deviceToken.id)
    deviceToken: DeviceToken;


}