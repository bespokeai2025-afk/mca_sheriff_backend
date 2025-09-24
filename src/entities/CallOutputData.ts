import { Entity, Column, Check, OneToMany, JoinColumn } from 'typeorm';
import { Common } from './Common';

export enum CallStatus {
  CONNECTED = "connected",
  USER_BUSY = "user_busy",
  DISCONNECTED = "disconnected",
  ENDED = "ended" // 👈 added since your JSON has "ended"
}

@Entity({ name: 'call_output_data' })
export class CallOutputData extends Common {

   // Name of the main category
    // @Column({ type: 'text', nullable: false })
    // vendor_id: string;

    // Description of the main category
    // @Column({ type: 'text', nullable: false })
    // crm_data_id: string;


  //   // Description of the main category
  //   @Column({ type: 'text', nullable: false })
  //   end_reason: string;

  // // Identifiers
  // @Column({ type: 'text', nullable: false })
  // call_id: string;

  // @Column({ type: 'text', nullable: false })
  // agent_id: string;

  // // Agent / Customer Info
  // @Column({ type: 'text', nullable: false })
  // agent_name: string;

  // @Column({ type: 'text', nullable: true })
  // customer_name: string;

  // @Column({ type: 'text', nullable: false })
  // from_number: string;

  // @Column({ type: 'text', nullable: false })
  // to_number: string;

  // // Call Metadata
  // @Column({ type: 'bigint', nullable: false })
  // start_timestamp: number;

  // @Column({ type: 'bigint', nullable: false })
  // end_timestamp: number;

  // @Column({ type: 'bigint', nullable: false })
  // duration_ms: number;

  // @Column({ type: 'text', nullable: false })
  // direction: string;

  // @Column({ type: 'enum', enum: CallStatus, default: CallStatus.DISCONNECTED })
  // call_status: CallStatus;

  // // Call Content
  // @Column({ type: 'text', nullable: true })
  // transcript: string;

  // @Column({ type: 'text', nullable: true })
  // call_summary: string;

  // @Column({ type: 'text', nullable: true })
  // recording_url: string;

  // // Business Data
  // @Column({ type: 'text', nullable: true })
  // user_sentiment: string;

  // @Column({ type: 'boolean', default: false })
  // call_successful: boolean;

  // @Column({ type: 'boolean', default: false })
  // customer_was_satisfied: boolean;

  // @Column({ type: 'text', nullable: true })
  // reason_for_call: string;

  // // Performance Metrics
  // @Column({ type: 'float', nullable: true })
  // call_cost_combined_cost: number;

  // @Column({ type: 'float', nullable: true })
  // latency_e2e_p50: number;

  // @Column({ type: 'text', nullable: true })
  // disconnection_reason: string;

  // // Optional Technical Data
  // @Column({ type: 'float', nullable: true })
  // llm_token_usage_average: number;

  // @Column({ type: 'text', nullable: true })
  // telephony_identifier_twilio_call_sid: string;

  // @Column({ type: 'text', nullable: false })
  // event: string;

  // @Column({ type: 'text', nullable: false })
  // call_type: string;

  // @Column({ type: 'int', nullable: false })
  // agent_version: number;

//   @Column({ type: 'text', nullable: false })
//   raw_data: string;
// }

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

  @Column({ name: "customer_name", type: "varchar", nullable: true })
  customerName: string;

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
}

