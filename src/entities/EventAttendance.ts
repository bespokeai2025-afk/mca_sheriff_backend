import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Event } from './Event';
import { User } from './User';
import { Common } from './Common';
import { Admin } from './Admin';

// EventAttendance entity representing attendance records for events
@Entity('event_attendance')
export class EventAttendance extends Common {

    // Relationship with Event entity
    @ManyToOne(() => Event, (event) => event.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event_id: Event;

    // Relationship with User entity
    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user_id: User;

    // Relationship with Admin entity for the admin who marked attendance
    @ManyToOne(() => Admin, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'marked_by' })
    marked_by: Admin;

    // Reward coins given for attending the event
    @Column({ type: 'int', default: 0 })
    reward_coins: number;

    // Timestamp for when attendance was marked
    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    marked_at: Date;

    // Flag indicating if the attendance has been revoked
    @Column({ type: 'boolean', default: false })
    revoked: boolean;

    // Relationship with Admin entity for the admin who revoked attendance
    @ManyToOne(() => Admin, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'revoked_by' })
    revoked_by: Admin | null;

    // Timestamp for when attendance was revoked
    @Column({ type: 'timestamp', nullable: true })
    revoked_at: Date | null;
}