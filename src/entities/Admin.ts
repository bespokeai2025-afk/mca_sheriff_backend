import { Entity, Column, OneToMany, BeforeUpdate, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Common } from "./Common"
import { RefreshToken } from "./RefreshToken"
import { OTPVerification } from "./OtpVerification";

@Entity()
export class Admin {
   @PrimaryGeneratedColumn("uuid")
    id: string
    @Column({ type: "varchar", length: 255, nullable: true })
    name: string

     @Column({ type: "varchar", length: 255, nullable: true })
    lastName: string

     @Column({ type: "varchar", length: 255, nullable: true })
    organization: string

    @Column({ type: "varchar", length: 15, unique: true })
    mobile: string

    @Column({ type: "varchar", length: 255, unique: true, nullable: true })
    email: string

    @Column({ type: "varchar", length: 255, unique: false, nullable: true })
    password: string

    @Column({ type: "boolean", default: false })
    is_otp_verified: boolean

    @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.id)
    refreshTokens: RefreshToken[];

    @OneToMany(() => OTPVerification, (otpVerification) => otpVerification.id)
    otpVerification: OTPVerification

    @Column({ type: "boolean", default: true })
    isActive: boolean

    @Column({ type: "boolean", default: false })
    isDeleted: boolean

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updatedAt: Date

    @BeforeUpdate()
    updateTimestamp() {
        this.updatedAt = new Date();
    }
}