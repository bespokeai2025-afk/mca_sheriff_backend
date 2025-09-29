import { 
  Entity, Column, BeforeUpdate, 
  CreateDateColumn, PrimaryGeneratedColumn, 
  UpdateDateColumn 
} from 'typeorm';

@Entity({ name: 'call_frequency_setting' })
export class CallFrequencySetting {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "int", nullable: true })
  number_count: number | null;

  @Column({ type: "text", nullable: true })
  selected_days: string | null;

  @Column({ type: "text", nullable: true })
  selected_weeks: string | null;

  @Column({ type: "text", nullable: false })
  call_frequency_setting: string;

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
