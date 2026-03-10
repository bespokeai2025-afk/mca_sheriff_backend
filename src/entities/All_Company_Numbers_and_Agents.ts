import {
  Entity,
  Column,
  BaseEntity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from "typeorm";

@Entity({ name: 'All_Company_Numbers_and_Agents' })
export class AllCompanyNumbersAndAgents extends BaseEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  company_name: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  company_id: string;

  // ✅ FIXED
  @Column({
    type: 'text',
    array: true,
    default: () => "'{}'"
  })
  phone_number: string[];

  // ✅ FIXED
  @Column({
    type: 'text',
    array: true,
    default: () => "'{}'"
  })
  outbound_agent_id: string[];

  // ✅ FIXED
  @Column({
    type: 'text',
    array: true,
    default: () => "'{}'"
  })
  outbound_agent_name: string[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}