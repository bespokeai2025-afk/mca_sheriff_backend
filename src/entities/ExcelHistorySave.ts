import { Entity, Column, Check, OneToMany, JoinColumn, BeforeUpdate, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';


@Entity({ name: 'excel_history_save' })
// @Check('priority >= 0') // Ensure priority is non-negative
// export class CRMData extends Common {
export class CRMData /* extends Common */ {
    @PrimaryGeneratedColumn("uuid")
    id: string
    // Name of the main category
    @Column({ type: 'text' })
    file_name: string;

    
    // Description of the main category
    @Column({ type: 'text' })
    fail_count: string;

    @Column({ type: 'text', nullable: true })
    lead_id: string;

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

 
   
}