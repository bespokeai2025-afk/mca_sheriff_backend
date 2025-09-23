import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User'; // Adjust the import path as necessary
import { Notification } from './Notification'; // Adjust the import path as necessary
import { Common } from './Common';
import { Event } from './Event';

@Entity('inapp_notifications')
export class inappNotification extends Common {

    // @ManyToOne(() => User, user => user.inappNotifications, { onDelete: 'CASCADE' })
    // @JoinColumn({ name: 'user_id' })
    // user: User;

    // @ManyToOne(() => Notification, notification => notification.inappNotifications, { onDelete: 'CASCADE' })
    // @JoinColumn({ name: 'notification_id' })
    // notification: Notification;


    @ManyToOne(() => Event, event => event.id, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'event_id' })
    event_id: Event;

    @Column({ type: 'varchar', length: 255, default: '' })
    title: string;  // New field for notification title

    @Column({ type: 'text', default: '' })
    message: string;

    @Column({ type: 'jsonb', default: {} })
    payload: Record<string, any>;  // New field for custom JSON payload

    @Column({ type: 'text', default: 0 })
    delay: string;  // New field for notification delay (in seconds)

    @Column({ type: 'text', default: "", nullable: true })
    topic: string;  // New field for notification delay (in seconds)

    @Column({ type: 'jsonb', default: [], nullable: true })
    tokens: string[];

    @Column({ type: 'date', nullable: true })
    scheduledTime: Date;

    // @Column({ type: 'text' })
    // status: "sent" | "delivered" | "failed"
}