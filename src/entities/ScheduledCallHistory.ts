// entities/ScheduledCallHistory.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { CallFrequencySetting } from "./CallFrequencySetting";

@Entity()
export class ScheduledCallHistory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => CallFrequencySetting)
  frequencySetting: CallFrequencySetting;

  @Column({ type: "timestamp" })
  executedAt: Date;

  @Column({ type: "enum", enum: ["pending", "success", "failed", "skipped"], default: "pending" })
  status: "pending" | "success" | "failed" | "skipped";

  @Column({ type: "text", nullable: true })
  webhookResponse?: string; // store webhook response

  @Column({ type: "text", nullable: true })
  responseData?: string; // store RetellAI response

  @Column({ type: "text", nullable: true })
  errorMessage?: string;
    @Column({ type: "boolean", default: true })
    isActive: boolean

    @Column({ type: "boolean", default: false })
    isDeleted: boolean

  @CreateDateColumn()
  createdAt: Date;

   // Timestamp for when the entity was last updated
      @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
      updatedAt: Date
}
