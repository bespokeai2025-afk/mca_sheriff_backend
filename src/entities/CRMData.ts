/**
 * MainCategory entity representing the main categories in the system
 * Defines the structure and relationships for main categories
 */

import { Entity, Column, Check, OneToMany, JoinColumn } from 'typeorm';
import { Common } from './Common';


// MainCategory entity representing main categories
@Entity({ name: 'CRM_data' })
// @Check('priority >= 0') // Ensure priority is non-negative
export class CRMData extends Common {

    // Name of the main category
    @Column({ type: 'text' })
    name: string;

    // Description of the main category
    @Column({ type: 'text' })
    mobile_number: string;
   
}