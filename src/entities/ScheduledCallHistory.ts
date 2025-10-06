import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { CallFrequencySetting } from "./CallFrequencySetting";

@Entity()
export class ScheduledCallHistory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => CallFrequencySetting)
  frequencySetting: CallFrequencySetting;

  @Column({ type: "timestamp" })
  executedAt: Date;

  @Column({ default: "pending" })
  status: "pending" | "success" | "failed";

  @Column({ type: "text", nullable: true })
  responseData?: string; // store RetellAI response if needed

  @Column({ type: "text", nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;
}
