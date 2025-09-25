import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
// import { Notification } from './Notification'; // Adjust the import path as necessary
import { Common } from './Common';
import { User } from './User';

@Entity('device_token')
export class DeviceToken extends Common {

    @Column({ type: 'text', nullable: true })
    token: string;

    @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

}
