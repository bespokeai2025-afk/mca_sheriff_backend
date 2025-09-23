/**
 * MainCategory entity representing the main categories in the system
 * Defines the structure and relationships for main categories
 */

import { Entity, Column, Check, OneToMany, JoinColumn } from 'typeorm';
import { Common } from './Common';


// MainCategory entity representing main categories
@Entity({ name: 'referenceType' })
@Check('priority >= 0') // Ensure priority is non-negative
export class RefrenceSlider extends Common {

    // Name of the main category
    @Column({ type: 'text' })
    name: string;

    // Description of the main category
    @Column({ type: 'text' })
    description: string;

    // URL or path to the category image (nullable)
    @Column({ type: 'text', nullable: true })
    image: string | null;

    // Priority for sorting/display order
    @Column({ type: 'int', default: 0 })
    priority: number;

    @Column({ type: 'text' })
    link: string;

    @Column({ type: 'text' })
    activity: string;
}