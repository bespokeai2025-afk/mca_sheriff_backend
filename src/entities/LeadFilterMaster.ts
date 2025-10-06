import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeUpdate } from "typeorm";

@Entity({ name: "lead_filter_master" })
export class LeadFilterMaster {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    
     @Column({ type: "varchar", length: 100, unique: true })
    filterCode: string;

    @Column({ type: "varchar", length: 255 })
    filterName: string;
    
    @Column({ type: "boolean", default: true })
    isActive: boolean;

   
    @Column({ type: "boolean", default: false })
    isDeleted: boolean;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updatedAt: Date;

    @BeforeUpdate()
    updateTimestamp() {
        this.updatedAt = new Date();
    }
}
