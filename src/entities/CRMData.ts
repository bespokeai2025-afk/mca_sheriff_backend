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

    @Column({ type: 'text', nullable: true })
    email: string;

    @Column({ type: 'text', nullable: true })
    unique_id: string;

    @Column({ type: 'text', nullable: true })
    lead_id: string;

      @Column({ type: 'text', nullable: true })
    new_propinfo_street2: string;

      @Column({ type: 'text', nullable: true })
    address1_city: string;
    
      @Column({ type: 'text', nullable: true })
    address1_line2: string;
    
      @Column({ type: 'text', nullable: true })
    lastname: string;

      @Column({ type: 'text', nullable: true })
    address1_composite: string;

      @Column({ type: 'text', nullable: true })
    yomifullname: string;

      @Column({ type: 'text', nullable: true })
    new_propinfo_stateorprovince: string;

      @Column({ type: 'text', nullable: true })
    address1_stateorprovince: string;

      @Column({ type: 'text', nullable: true })
    new_propinfo_street3: string;

      @Column({ type: 'text', nullable: true })
    address1_line1: string;

      @Column({ type: 'text', nullable: true })
    new_propinfo_city: string;

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