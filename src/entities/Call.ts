import {
  Entity,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn
} from "typeorm";
import { Lead } from "./Lead";

@Entity()
export class Call {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Lead, (lead) => lead.calls, { onDelete: "CASCADE" })
  lead: Lead;

  @Column({ type: "varchar" })
  callType: "inbound" | "outbound";

  @Column({ type: "varchar", default: "initiated" })
  callStatus: "initiated" | "completed" | "no_answer" | "busy" | "failed";

  @Column({ type: "varchar", nullable: true })
  direction: "inbound" | "outbound"; // from Retell

  // ── Retell IDs ────────────────────────────────────────────────────────────

  @Column({ type: "varchar", nullable: true })
  retellCallId: string;

  @Column({ type: "varchar", nullable: true })
  agentId: string;

  @Column({ type: "varchar", nullable: true })
  agentName: string;

  @Column({ type: "int", nullable: true })
  agentVersion: number;

  // ── Numbers ───────────────────────────────────────────────────────────────

  @Column({ type: "varchar", nullable: true })
  fromNumber: string;

  @Column({ type: "varchar", nullable: false })
  toNumber: string;

  // ── Duration & Timing ─────────────────────────────────────────────────────

  @Column({ type: "int", nullable: true })
  durationSeconds: number;

  @Column({ type: "bigint", nullable: true })
  durationMs: number;

  @Column({ type: "timestamp", nullable: true })
  startedAt: Date;

  @Column({ type: "timestamp", nullable: true })
  endedAt: Date;

  @Column({ type: "timestamp", nullable: true })
  completedAt: Date;

  // ── Status & Outcome ──────────────────────────────────────────────────────

  @Column({ type: "varchar", nullable: true })
  disconnectionReason: string;

  @Column({ type: "varchar", nullable: true })
  callOutcome: string; // e.g. "qualified_complete"

  @Column({ type: "boolean", nullable: true })
  callSuccessful: boolean;

  @Column({ type: "boolean", nullable: true })
  inVoicemail: boolean;

  @Column({ type: "varchar", nullable: true })
  lastNode: string;

  // ── Sentiment & Analysis ──────────────────────────────────────────────────

  @Column({ type: "varchar", nullable: true })
  sentiment: "positive" | "neutral" | "negative";

  @Column({ type: "text", nullable: true })
  transcript: string;

  @Column({ type: "text", nullable: true })
  callSummary: string;

  // ── Recordings & Logs ─────────────────────────────────────────────────────

  @Column({ type: "text", nullable: true })
  recordingS3Key: string; // recording_url from Retell

  @Column({ type: "text", nullable: true })
  recordingMultiChannelUrl: string;

  @Column({ type: "text", nullable: true })
  publicLogUrl: string;

  // ── Cost ──────────────────────────────────────────────────────────────────

  @Column({ type: "decimal", precision: 10, scale: 4, nullable: true })
  callCostTotal: number;

  @Column({ type: "int", nullable: true })
  callCostDurationSeconds: number;

  // ── Raw Payload ───────────────────────────────────────────────────────────

  @Column({ type: "jsonb", nullable: true })
  rawPayload: Record<string, any>; // stores full Retell webhook payload

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
