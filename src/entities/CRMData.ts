/**
 * MainCategory entity representing the main categories in the system
 * Defines the structure and relationships for main categories
 */

import { Entity, Column, Check, OneToMany, JoinColumn, BeforeUpdate, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
// import { Common } from './Common';
import { CallOutputData } from './CallOutputData';


// MainCategory entity representing main categories
@Entity({ name: 'CRM_data' })
// @Check('priority >= 0') // Ensure priority is non-negative
// export class CRMData extends Common {
export class CRMData /* extends Common */ {
    @PrimaryGeneratedColumn("uuid")
    id: string
    // Name of the main category
    @Column({ type: 'text' })
    name: string;

    // Description of the main category
    @Column({ type: 'text' })
    mobile_number: string;

    @Column({ type: "boolean", default: true})
    need_to_call: boolean;
      
    @Column({ type: "boolean", default: true })
    isActive: boolean

    @Column({ type: "boolean", default: false })
    isDeleted: boolean

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date

    // Timestamp for when the entity was last updated
    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updatedAt: Date

    // Update the updatedAt timestamp before the entity is updated
    @BeforeUpdate()
    updateTimestamp() {
        this.updatedAt = new Date();
    }

    @OneToMany(() => CallOutputData, (callOutput) => callOutput.crmData)
    callOutputs: CallOutputData[];
}