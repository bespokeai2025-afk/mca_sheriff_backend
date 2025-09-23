import {
    Entity, Column, ManyToOne, JoinColumn
} from 'typeorm';
import { Event } from './Event';
import { User } from './User';
import { EventType } from './EventTypes';
import { Common } from './Common';

// EventRegistration entity representing user registrations for events
@Entity('event_registrations')
export class EventRegistration extends Common {

    // Relationship with Event entity
    @ManyToOne(() => Event, (event) => event.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'event_id' })
    event_id: Event;

    // Relationship with User entity
    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user_id: User;

    // Relationship with EventType entity (nullable)
    @ManyToOne(() => EventType, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'event_type_id' })
    event_type_id: EventType | null;

    // Status of the registration
    @Column({ type: 'varchar', length: 20, default: 'Registered' })
    status: 'Registered' | 'Cancelled';

    // Relationship with User entity for the user who cancelled the registration (nullable)
    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'cancelled_by' })
    cancelled_by: User | null;

    // Reason for cancellation (nullable)
    @Column({ type: 'text', nullable: true, default: null })
    cancellation_reason: string | null;

    // Timestamp for when the registration was cancelled (nullable)
    @Column({ type: 'timestamp', nullable: true })
    cancelled_at: Date | null;

    @Column({ type: 'boolean', nullable: true, default: false })
    void: Boolean
}