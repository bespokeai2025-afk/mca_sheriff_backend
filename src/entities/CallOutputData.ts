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
    mobile_number: string;

    // Description of the main category
    @Column({ type: 'text' })
    sentiment_analysis: string;

    // Description of the main category
    @Column({ type: 'text' })
    end_reason: string;

     // Description of the main category
    @Column({ type: 'text' })
    time: string;

       // Description of the main category
    @Column({ type: 'text' })
    status: string;

    // URL or path to the category image (nullable)
    // @Column({ type: 'text', nullable: true })
    // image: string | null;

    // Priority for sorting/display order
    // @Column({ type: 'int', default: 0 })
    // priority: number;

   
}