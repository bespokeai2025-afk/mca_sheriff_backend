/**
 * MainCategory entity representing the main categories in the system
 * Defines the structure and relationships for main categories
 */

import { Entity, Column, Check, OneToMany, JoinColumn } from 'typeorm';
import { Common } from './Common';


// MainCategory entity representing main categories
@Entity({ name: 'call_output_data' })
// @Check('priority >= 0') // Ensure priority is non-negative
export class UserCallingData extends Common {

    // Name of the main category
    @Column({ type: 'text' })
    vendor_id: string;

    // Description of the main category
    @Column({ type: 'text' })
    crm_data_id: string;

    // Description of the main category
    @Column({ type: 'text' })
    sentiment_analysis: string;

    // Description of the main category
    @Column({ type: 'text' })
    end_reason: string;

   @Column({ type: 'text', nullable: false })
    call_status: string;

    // Contact Information
  @Column({ type: 'text', nullable: false })
  agent_name: string;

  @Column({ type: 'text', nullable: false })
  customer_name: string;

  @Column({ type: 'text', nullable: false })
  from_number: string;

  @Column({ type: 'text', nullable: false })
  to_number: string;

  // Call Metadata
  @Column({ type: 'bigint', nullable: false })
  start_timestamp: number;

  @Column({ type: 'bigint', nullable: false })
  end_timestamp: number;

  @Column({ type: 'bigint', nullable: false })
  duration_ms: number;

  @Column({ type: 'text', nullable: false })
  direction: string;

  // Call Content
  @Column({ type: 'text', nullable: false })
  transcript: string;

  @Column({ type: 'text', nullable: false })
  call_summary: string;

  @Column({ type: 'text', nullable: false })
  recording_url: string;

  // Business Data
  @Column({ type: 'text', nullable: false })
  user_sentiment: string;

  @Column({ type: 'boolean', nullable: false })
  call_successful: boolean;

  @Column({ type: 'boolean', nullable: false })
  customer_was_satisfied: boolean;

  @Column({ type: 'text', nullable: false })
  reason_for_call: string;

  // Performance Metrics
  @Column({ type: 'float', nullable: false })
  call_cost_combined_cost: number;

  @Column({ type: 'bigint', nullable: false })
  latency_e2e_p50: number;

  @Column({ type: 'text', nullable: false })
  disconnection_reason: string;

  // Optional Technical Data
  @Column({ type: 'float', nullable: false })
  llm_token_usage_average: number;

  @Column({ type: 'text', nullable: false })
    telephony_identifier_twilio_call_sid: string;
   

    
  @Column({ type: 'text', nullable: false })
event: string;

  @Column({ type: 'text', nullable: false })
   call_type: string;

 @Column({ type: 'text', nullable: false })
    agent_version: string;

 
}

   
