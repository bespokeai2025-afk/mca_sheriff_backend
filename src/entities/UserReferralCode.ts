const { Entity, Column, ManyToOne, JoinColumn } = require('typeorm');
import { User } from './User';
import { Common } from './Common';
import { OneToOne } from 'typeorm';

/**
 * Represents a user's referral code and associated data.
 * Inherits common properties from the Common class.
 */
@Entity('user_referral_codes')
export class UserReferralCode extends Common {

    /**
     * The user associated with this referral code.
     * This establishes a one-to-one relationship with the User entity.
     * The onDelete: "CASCADE" option ensures that if the user is deleted,
     * the associated referral code will also be deleted.
     */
    @OneToOne(() => User, (user) => user.id, { onDelete: "CASCADE" })
    @JoinColumn({ name: 'user_id' })
    user_id: User;

    /**
     * The unique referral code for the user.
     * This code is of type varchar with a maximum length of 20 characters
     * and must be unique across all records in the user_referral_codes table.
     */
    @Column({ type: 'varchar', length: 20, unique: true })
    referral_code: string;

    /**
     * The default reward coins associated with the referral code.
     * This is an integer value that defaults to 50 if not specified.
     */
    @Column({ type: 'int', default: 50 })
    default_reward_coins: number;

}