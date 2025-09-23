import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './User'; // Adjust the import path as necessary
import { Event } from './Event'; // Adjust the import path as necessary
import { Common } from './Common';
import { NotificationType } from './NotificationType';
import { NotificationReadReceipt } from './NotificationReadReceipt';
import { PushNotification } from './PushNotification';
import { DeviceToken } from './DeviceToken';

@Entity('notification')
export class Notification extends Common {

    @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Event, event => event.id, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'event_id' })
    event: Event;

    @ManyToOne(() => NotificationType, notificationType => notificationType.id)
    @JoinColumn({ name: 'type_id' })
    type: NotificationType;

    @Column({ type: 'varchar', length: 255, default: '' })
    title: string;  // New field for notification title

    @Column({ type: 'text', default: '' })
    message: string;

    @Column({ type: 'text' ,default:''})
    notificationcategory: string;

    @Column({ type: 'boolean', default: false })
    is_read: boolean;

    @Column({ type: 'boolean', default: false })
    is_actioned: boolean;

    @Column({ type: 'timestamp', nullable: true })
    expires_at: Date;

    @Column({ type: 'boolean', default: false })
    is_global: boolean;

    // @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
    // payload: Record<string, any>;

    // add custom payload properties

    // Relationship with OTPVerification entity
    @OneToMany(() => NotificationReadReceipt, (readReceipts) => readReceipts.notification)
    readReceipts: NotificationReadReceipt;


    // Relationship with OTPVerification entity
    @OneToMany(() => DeviceToken, (deviceToken) => deviceToken.token)
    deviceToken: DeviceToken;
}