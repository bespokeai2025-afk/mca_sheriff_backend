import { BeforeUpdate, Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export abstract class Common {
    // Unique identifier for the entity
    @PrimaryGeneratedColumn("uuid")
    id: string
    
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