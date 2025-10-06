import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeUpdate,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { LeadFilterMaster } from "./LeadFilterMaster";

@Entity({ name: "lead_filter_status" })
export class LeadFilterStatus {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // Optional text or condition query
  @Column({ type: "varchar", nullable: true })
  query?: string;

  // Store multiple selected values (array of strings)
  @Column({ type: "simple-array", nullable: true })
  multiple_selected?: string[];

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "boolean", default: false })
  isDeleted: boolean;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }

  /**
   * ✅ Relation with LeadFilterMaster
   * Each status belongs to one filter master.
   * Automatically manages the foreign key (lead_filter_master_id).
   */
  @ManyToOne(() => LeadFilterMaster, { onDelete: "CASCADE", eager: true })
  @JoinColumn({ name: "lead_filter_master_id" })
  leadFilterMaster: LeadFilterMaster;
}
