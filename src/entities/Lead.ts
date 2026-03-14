import {
  Entity,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  BeforeUpdate
} from "typeorm";
import { Call } from "./Call";
import { Document } from "./Document";

@Entity()
export class Lead {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 150, nullable: true })
  fullName: string;

  @Column({ type: "varchar", length: 20 })
  phone: string;

  @Column({ type: "varchar", length: 150, nullable: true })
  email: string;

  @Column({ type: "varchar", length: 200, nullable: true })
  companyName: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  promoCode: string;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  fundingAmount: number;

  // ── Business Info ─────────────────────────────────────────────────────────

  @Column({ type: "varchar", length: 200, nullable: true })
  stateName: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  businessStartDate: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  businessType: string;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  monthlyRevenue: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  businessAddress: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  businessEin: string;

  @Column({ type: "varchar", length: 20, nullable: true }) // ✅ increased from 10
  ownershipPercentage: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  ownerDob: string;

  @Column({ type: "varchar", length: 20, nullable: true }) // ✅ increased from 10
  ownerSsnLast4: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  homeAddress: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  homeNumber: string;

  // ── Lead Qualification ────────────────────────────────────────────────────

  @Column({ type: "varchar", nullable: true })
  callOutcome: string;

  @Column({ type: "boolean", nullable: true })
  bankStatementsUploaded: boolean;

  @Column({ type: "varchar", length: 50, nullable: true })
  bankStatementsStatus: string;

  @Column({ type: "boolean", nullable: true })
  sentToUnderwriting: boolean;

  @Column({ type: "boolean", default: false })
  callbackRequested: boolean;

  @Column({ type: "text", nullable: true })
  missingInformation: string;

  // ── Lead Status ───────────────────────────────────────────────────────────

  @Column({ type: "varchar", length: 20 })
  source: "website" | "inbound" | "outbound";

  @Column({
    type: "varchar",
    default: "need_to_call"
  })
  status:
    | "need_to_call"
    | "calling"
    | "completed"
    | "interested"
    | "not_interested"
    | "not_connected"
    | "do_not_call";

  @Column({ type: "varchar", nullable: true })
  sentiment: "positive" | "neutral" | "negative";

  @Column({ type: "int", default: 0 })
  attemptCount: number;

  @Column({ type: "timestamp", nullable: true })
  lastCalledAt: Date;

  @Column({ type: "varchar", default: "pending" })
  statementStatus: "pending" | "uploaded";

  // ── Relations ─────────────────────────────────────────────────────────────

  @OneToMany(() => Call, (call) => call.lead)
  calls: Call[];

  @OneToMany(() => Document, (document) => document.lead)
  documents: Document[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }
}