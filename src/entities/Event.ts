import { Entity, Column, ManyToOne, JoinColumn, Check, OneToMany } from 'typeorm';
import { User } from './User';
import { Common } from './Common';
import { Reward } from './Reward';
import { EventType } from './EventTypes';
import { EventAttendance } from './EventAttendance';
import { RewardsHistory } from './RewardHistory';
import { Admin } from './Admin'
import { Notification } from './Notification';
import { PushNotification } from './PushNotification';
// Event entity representing events in the system
@Entity('events')
@Check('from_date <= to_date') // Ensure the event start date is before the end date
export class Event extends Common {

    // Title of the event
    @Column({ type: 'varchar', length: 255, nullable: false })
    title: string;

    // Relationship with User entity for the user who added the event
    @ManyToOne(() => Admin, admin => admin.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'added_by' })
    added_by: Admin;

    // Relationship with EventType entity
    @ManyToOne(() => EventType, (eventType) => eventType.id, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'event_type_id' })
    event_type_id: EventType;

    // Speaker of the event
    @Column({ type: 'varchar', length: 255, nullable: false })
    speaker: string;

    // Details about the speaker
    @Column({ type: 'text', nullable: true })
    speaker_details: string;

    // Start date of the event
    @Column({ type: 'date', nullable: false })
    from_date: Date;

    // End date of the event
    @Column({ type: 'date', nullable: false })
    to_date: Date;

    // Start time of the event
    @Column({ type: 'time', nullable: false })
    from_time: string;


    @Column({ nullable: true })  // Allow null in case there's no image
    image: string;

    // End time of the event
    @Column({ type: 'time', nullable: false })
    to_time: string;

    // Indicates if the event is paid or free
    @Column({ type: 'varchar', length: 10, nullable: false })
    paid_or_free: string;

    // Relationship with Reward entity for attendees
    @ManyToOne(() => Reward, reward => reward.id, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'reward_id_for_attendees' })
    reward_id_for_attendees: Reward;

    // Description of the event
    @Column({ type: 'text', nullable: false })
    description: string;

    // What attendees will learn from the event
    @Column({ type: 'text', nullable: false })
    what_you_will_learn: string;

    // Location of the event
    @Column({ type: 'varchar', length: 255, nullable: true })
    location: string;

    // Latitude for the event location
    @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
    latitude: number;

    // Longitude for the event location
    @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
    longitude: number;

    // Google Maps link for the event location
    @Column({ type: 'text', nullable: true })
    google_map_link: string;

    // Additional optional information in JSON format
    @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
    other_optional: object;

    // Additional optional information in JSON format
    @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
    other_optional_2: object;

    // Flag indicating if the event is accepting registrations
    @Column({ type: 'boolean', default: true })
    is_accepting_registrations: boolean;

    // Current status of the event
    @Column({ type: 'varchar', length: 20, default: 'Not Started' })
    status: string;

    // Maximum number of attendees for the event
    @Column({ type: 'int', nullable: true })
    max_attendees: number;

    // Registration deadline for the event
    @Column({ type: 'timestamp', nullable: true })
    registration_deadline: Date;

    @Column({ type: 'timestamp', nullable: true })
    event_start_time_utc: Date;

    @Column({ type: 'timestamp', nullable: true })
    event_end_time_utc: Date;

    // Tags associated with the event
    @Column({ type: 'text', array: true, default: () => 'ARRAY[]::TEXT[]' })
    tags: string[];

    @Column({ type: 'text', array: true, default: () => 'ARRAY[]::TEXT[]' })
    whatlearn: string[];

    @Column({ type: 'text', array: true, default: () => 'ARRAY[]::TEXT[]' })
    summary: string[];

    // Initial price for the event
    @Column({ type: 'int', nullable: true })
    initial_price: number;

    // Documented price for the event
    @Column({ type: 'int', nullable: true })
    documented_price: number;

    // Early bird price for the event
    @Column({ type: 'int', nullable: true })
    early_bird_price: number;

    // Late fee for the event
    @Column({ type: 'int', nullable: true })
    late_fee: number;

    // Total number of registrations for the event
    @Column({ type: 'int', default: 0 })
    total_no_of_registrations: number;

    // Total amount collected from registrations
    @Column({ type: 'int', default: 0.00 })
    total_amount_collected: number;

    // Total amount remaining to be collected
    @Column({ type: 'int', default: 0.00 })
    total_amount_remaining: number;

    // Relationship with EventAttendance entity
    @OneToMany(() => EventAttendance, (eventAttendance) => eventAttendance.id)
    eventAttendance: EventAttendance

    // Relationship with EventAttendance entity
    @OneToMany(() => RewardsHistory, (rewardHistory) => rewardHistory.id)
    rewardHistory: RewardsHistory[]

    @Column({ type: 'varchar', length: 500, default: 'Not_Started' })
    meeting_Link: string;

    @Column({ nullable: true })  // Allow null in case there's no image
    pdf: string;

    @Column({ type: 'varchar', length: 10, default: 'Offline', nullable: true })
    mode_of_event: string;


    @Column({ type: 'int', default: 0 })
    no_of_registrations: number;

    @Column({ type: 'int', default: 0 })
    no_of_attendees: number;



    // Relationship with OTPVerification entity
    @OneToMany(() => Notification, (notification) => notification.id)
    notification: Notification;

    // Relationship with OTPVerification entity
    @OneToMany(() => PushNotification, (pushNotification) => pushNotification.id)
    pushNotification: PushNotification;


}