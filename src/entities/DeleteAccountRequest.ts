import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './User';
import { Common } from './Common';

// DeleteAccountRequest entity representing requests to delete user accounts
@Entity('delete_account_requests')
export class DeleteAccountRequest extends Common {

    // Relationship with User entity
    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user_id: User ;

    // Status of the delete account request
    @Column({ type: 'varchar', length: 50, default: 'PENDING' })
    request_status: 'PENDING' | 'COMPLETED' | 'REJECTED';

    // Reason for the delete account request
    @Column({ type: 'text', nullable: true })
    request_reason: string;

    // Timestamp for when the request was made
    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    requested_at: Date;

    // Timestamp for when the request was processed
    @Column({ type: 'timestamp', nullable: true })
    processed_at: Date | null;

    // Relationship with User entity for the user who processed the request
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'processed_by' })
    processed_by: User | null;
}