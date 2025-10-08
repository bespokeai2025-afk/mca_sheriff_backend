import { Entity, Column, PrimaryColumn, BaseEntity, PrimaryGeneratedColumn } from "typeorm";

@Entity("phone_numbers")
export class PhoneNumber extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @PrimaryColumn()
  phone_number_id: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  outbound_agent_id: string;

  @Column({ nullable: true })
  outbound_agent_name: string;
  
  @Column({ nullable: true })
  is_active: boolean;
}
