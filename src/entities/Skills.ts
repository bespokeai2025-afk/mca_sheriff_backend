import { JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { MainCategory } from "./MainCategory";
import { Answer } from "./Answer";

const { Entity, Column } = require('typeorm');
const { Common } = require('./Common');

// Skill entity representing skills associated with main categories
@Entity('skills')
export class Skill extends Common {

    // Relationship with MainCategory entity
    @ManyToOne(() => MainCategory, (mainCategory) => mainCategory.id)
    @JoinColumn({ name: "main_category_id" })
    main_category_id: MainCategory;

    // Name of the skill
    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string;

    // Description of the skill (nullable)
    @Column({ type: 'text', nullable: true })
    description: string;
}