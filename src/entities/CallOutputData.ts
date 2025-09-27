import { Entity, Column, Check, OneToMany, JoinColumn, BeforeUpdate, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Common } from './Common';

export enum CallStatus {
  CONNECTED = "connected",
  USER_BUSY = "user_busy",
  DISCONNECTED = "disconnected",
  ENDED = "ended" // 👈 added since your JSON has "ended"
}

@Entity({ name: 'call_output_data' })
export class CallOutputData {
      @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: 'text', nullable: true, default: null })
  vendor_id: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  crm_data_id: string | null;
  
  @Column({ name: "event", type: "varchar", nullable: true })
  event: string;

  @Column({ name: "call_id", type: "varchar", nullable: true })
  callId: string;

  @Column({ name: "call_type", type: "varchar", nullable: true })
  callType: string;

  @Column({ name: "agent_id", type: "varchar", nullable: true })
  agentId: string;

  @Column({ name: "agent_version", type: "varchar", nullable: true })
  agentVersion: string;

  @Column({ name: "agent_name", type: "varchar", nullable: true })
  agentName: string;

  @Column({ name: "name", type: "varchar", nullable: true })
  name: string;

  @Column({ name: "call_status", type: "varchar", nullable: true })
  callStatus: string;

  @Column({ name: "start_timestamp", type: "bigint", nullable: true })
  startTimestamp: number;

  @Column({ name: "end_timestamp", type: "bigint", nullable: true })
  endTimestamp: number;

  @Column({ name: "duration_ms", type: "bigint", nullable: true })
  durationMs: number;

  @Column({ name: "transcript", type: "text", nullable: true })
  transcript: string;

  @Column({ name: "from_number", type: "varchar", nullable: true })
  fromNumber: string;

  @Column({ name: "to_number", type: "varchar", nullable: true })
  toNumber: string;

  @Column({ name: "recording_url", type: "varchar", nullable: true })
  recordingUrl: string;

  @Column({ name: "disconnection_reason", type: "varchar", nullable: true })
  disconnectionReason: string;

  @Column({ name: "sentiment_analysis", type: "varchar", nullable: true })
  sentimentAnalysis: string;

  @Column({ name: "end_reason", type: "varchar", nullable: true })
  endReason: string;

  @Column({ name: "email", type: "varchar", nullable: true })
  email: string;
  
  // @Column({ name: "appointment_date", type: "varchar", nullable: true })
  // appointment_date: string;

  // @Column({ name: "appointment_end_date", type: "varchar", nullable: true })
  // appointment_end_date: string;

  @Column({ name: "calendly_booking_url", type: "varchar", nullable: true })
  calendly_booking_url: string;
    
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

