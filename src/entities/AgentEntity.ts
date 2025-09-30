import { Entity, Column, PrimaryColumn, BaseEntity, PrimaryGeneratedColumn } from "typeorm";

@Entity("agents")
export class Agent extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
  id: string;

  @PrimaryColumn()
  agent_id: string;

  @Column({ nullable: true })
  agent_name: string;

  @Column({ nullable: true })
  is_active: boolean;

  // @Column({ nullable: true })
  // channel: string;

  // @Column({ nullable: true })
  // version: number;

  // @Column({ type: "bigint", nullable: true })
  // last_modification_timestamp: number;

  // @Column({ type: "json", nullable: true })
  // response_engine: any;

  // @Column({ nullable: true })
  // webhook_url: string;

  // @Column({ nullable: true })
  // language: string;

  // @Column({ nullable: true })
  // voice_id: string;
}
