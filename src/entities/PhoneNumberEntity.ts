import { Entity, Column, PrimaryColumn, BaseEntity, PrimaryGeneratedColumn } from "typeorm";

@Entity("phone_numbers")
export class PhoneNumber extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  outbound_agent_id: string;

  @Column({ nullable: true })
  outbound_agent_name: string;

  @Column({ default: false })
  voicemail_enabled: boolean;

  @Column({ type: "text", nullable: true })
  voicemail_text: string | null;

  // @Column({ nullable: true })
  // is_active: boolean;
@Column({ name: "isActive", nullable: true })
is_active: boolean;

  
}
