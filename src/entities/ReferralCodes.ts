import { Entity, Column, Check, ManyToOne, JoinColumn } from 'typeorm';
import { Common } from './Common';
import { Event } from './Event';
import { User } from './User';

// ReferralCode entity representing referral codes in the system
export type ReferralType = 'userreferral' | 'eventcode';

@Entity('referral_codes')
@Check('max_redeem > 0') // Ensure max redeem is greater than zero
@Check('redeemed_count >= 0') // Ensure redeemed count is non-negative
export class ReferralCode extends Common {

    // Relationship with Event entity (nullable)
    @ManyToOne(() => Event, event => event.id, { nullable: true, onDelete: 'SET NULL' })
    event_id: Event;

    // Name of the referral code (nullable)
    @Column({ type: 'varchar', length: 255, nullable: true })
    name: string;

    // Unique code for the referral
    @Column({ type: 'varchar', length: 50, unique: true })
    code: string;

    // Expiry date for the referral code
    @Column({ type: 'timestamp' })
    expiry: Date;

    // Number of coins associated with the referral code
    @Column({ type: 'int', default: 0 })
    coins: number;

    // Maximum number of times the referral code can be redeemed
    @Column({ type: 'int', default: 1 })
    max_redeem: number;

    // Count of how many times the referral code has been redeemed
    @Column({ type: 'int', default: 0 })
    redeemed_count: number;

    // Check if the referral code is expired
    get isExpired(): boolean {
        return this.expiry < new Date();
    }

    // Type of referral (user or event)
    @Column({ type: 'enum', enum: ['userreferral', 'eventcode'] })
    referral_type: ReferralType;

    // Maximum validity period for the referral code (nullable)
    @Column({ type: 'interval', nullable: true })
    max_validity: string;

    // Relationship with User entity for the creator of the referral code
    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'created_by' })
    created_by: User;
}