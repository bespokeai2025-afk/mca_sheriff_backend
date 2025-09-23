import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './User';
import { Event } from './Event';
import { Common } from './Common';

// RewardsHistory entity representing the history of rewards transactions
@Entity('rewards_history')
export class RewardsHistory extends Common {

    // Relationship with User entity
    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user_id: User;

    // Relationship with Event entity (nullable)
    @ManyToOne(() => Event, (event) => event.id, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'event_id' })
    event_id: Event;

    // Relationship with User entity for the referred user (nullable)
    @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'referred_user_id' })
    referred_user_id: User;

    // Relationship with User entity for the referred user (nullable)
    @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'referrer_id' })
    referrer_id: User;

    // Type of transaction (earned or deducted)
    @Column({ type: 'varchar', length: 20 })
    transaction_type: 'Earned' | 'Deducted';

    @Column({ type: 'text', nullable: true })
    reward_type: 'referral' | "event"

    // Amount of coins involved in the transaction
    @Column({ type: 'int', nullable: false })
    amount: number;

    // Description of the transaction
    @Column({ type: 'text', nullable: false })
    description: string;

    // Timestamp for when the transaction occurred
    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    transaction_date: Date;
}