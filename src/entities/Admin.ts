import { Entity, Column, OneToMany } from "typeorm";
import { Common } from "./Common"
import { RefreshToken } from "./RefreshToken"
import { OTPVerification } from "./OtpVerification";
// import { EventAttendance } from "./EventAttendance";

// Admin entity representing the administrators in the system
@Entity()
export class Admin extends Common {

    // Name of the admin
    @Column({ type: "varchar", length: 255, nullable: true })
    name: string

    // Mobile number of the admin (unique)
    @Column({ type: "varchar", length: 15, unique: true })
    mobile: string

    // Email of the admin (unique)
    @Column({ type: "varchar", length: 255, unique: true, nullable: true })
    email: string

        // Email of the admin (unique)
    @Column({ type: "varchar", length: 255, unique: false, nullable: true })
    password: string

    // Flag indicating if the OTP is verified
    @Column({ type: "boolean", default: false })
    is_otp_verified: boolean

    // Relationship with RefreshToken entity
    @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.id)
    refreshTokens: RefreshToken[];

    // Relationship with OTPVerification entity
    @OneToMany(() => OTPVerification, (otpVerification) => otpVerification.id)
    otpVerification: OTPVerification

    // Relationship with EventAttendance entity
    // @OneToMany(() => EventAttendance, (eventAttendance) => eventAttendance.id)
    // eventAttendance: EventAttendance
}