import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User'; // Adjust the import path as necessary
import { Notification } from './Notification'; // Adjust the import path as necessary
import { Common } from './Common';

@Entity('notification_read_receipts')
export class NotificationReadReceipt extends Common {

    @ManyToOne(() => User, user => user.readReceipts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Notification, notification => notification.readReceipts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'notification_id' })
    notification: Notification;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    read_at: Date;
}