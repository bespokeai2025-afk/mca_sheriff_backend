import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeUpdate,
} from "typeorm";

@Entity({ name: "lead_filter_master" })
export class LeadFilterMaster {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100, unique: true })
  filterCode: string;
  

  @Column({ type: "varchar", length: 255 })
  filterName: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "boolean", default: false })
  isDeleted: boolean;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }
}




// import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeUpdate } from "typeorm";

// @Entity({ name: "lead_filter_master" })
// export class LeadFilterMaster {
//   @PrimaryGeneratedColumn("uuid")
//   id: string;

//   @Column({ type: "varchar", length: 100, unique: true })
//   filterCode: string;

//   @Column({ type: "varchar", length: 255 })
//   filterName: string;

//   // Store selected status IDs
//   @Column({ type: "simple-array", nullable: true })
//   new_currentstatus?: string[];

//   // Store labels from Dynamics
//   @Column({ type: "simple-array", nullable: true })
//   new_currentstatus_label?: string[];

//   // Store dynamic query for filtering
//   @Column({ type: "text", nullable: true })
//   query?: string;

//   @Column({ type: "boolean", default: true })
//   isActive: boolean;

//   @Column({ type: "boolean", default: false })
//   isDeleted: boolean;

//   @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
//   createdAt: Date;

//   @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
//   updatedAt: Date;

//   @BeforeUpdate()
//   updateTimestamp() {
//     this.updatedAt = new Date();
//   }
// }