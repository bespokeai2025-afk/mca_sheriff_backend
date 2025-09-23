import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Notification } from './Notification'; // Adjust the import path as necessary
import { Common } from './Common';


@Entity('notification_types')
export class NotificationType extends Common {

    @Column({ type: 'enum', enum: ["InApp", "Push", "both"], nullable: false, unique: true })
    type: "InApp" | "Push" | "both";

    @OneToMany(() => Notification, notification => notification.id)
    notifications: Notification[];
}
