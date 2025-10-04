import {
  Entity,
  Column,
  BeforeUpdate,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { CRMData } from "./CRMData"; // import your main CRMData entity

@Entity({ name: "excel_history_save" })
export class ExcelHistory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  file_name: string;

  @Column({ type: "int", default: 0 })
  fail_count: number;

  // New column to store number of successfully inserted CRM records
  @Column({ type: "int", default: 0 })
  correct_count: number;

  @Column({ type: "text", nullable: true })
  lead_id?: string;

  @ManyToOne(() => CRMData, { nullable: true })
  @JoinColumn({ name: "crm_data_id" })
  crm_data?: CRMData;

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
}
