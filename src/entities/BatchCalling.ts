import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";

/**
 * BatchCalling entity
 * Represents a batch of CRM calls created at a specific time.
 */
@Entity({ name: "batch_calling" })
export class BatchCalling {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // ✅ Custom ID generated from current datetime + milliseconds
  @Column({ type: "text", unique: true })
  batch_call_id: string;

    @Column({ type: 'text', nullable: true })
    lead_id: string;
       // Description of the main category
    @Column({ type: 'text' })
    mobile_number: string;

    @Column({ type: "text", nullable: true })
    name?: string;
  
    @Column({ type: "boolean", default: true})
    need_to_call: boolean;

  @Column({ type: "boolean", default: false })
send_to_retail: boolean;
  
    @Column({ type: "text", nullable: true })
  call_status?: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  /**
   * Automatically generate batch_call_id
   * Format: BATCH_YYYYMMDDHHMMSSmmm
   * Example: BATCH_20251014113015237
   */
  @BeforeInsert()
  generateBatchCallId() {
    const now = new Date();
    const pad = (n: number, width = 2) => String(n).padStart(width, "0");

    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hour = pad(now.getHours());
    const minute = pad(now.getMinutes());
    const second = pad(now.getSeconds());
    const ms = String(now.getMilliseconds()).padStart(3, "0");

    this.batch_call_id = `${year}${month}${day}${hour}${minute}${second}${ms}`;
  }
}
