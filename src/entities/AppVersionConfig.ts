import { Entity, Column, Unique, IntegerType } from 'typeorm';
import { Common } from './Common';

// AppVersionConfig entity representing application version configurations
@Entity('app_version_config')
@Unique(['app_version'])
export class AppVersionConfig extends Common {

    // Application version
    @Column({ type: "int", default: 0}) // Provide a default value
    app_version: number;


    // Flag indicating if a force update is required
    @Column({ type: 'boolean', default: false })
    force_update: boolean;

    // Message to display during a forced update
    @Column({ type: 'text', nullable: true })
    force_update_message: string;

    // Flag indicating if the privacy policy has been updated
    @Column({ type: 'boolean', default: false })
    privacy_policy_updated: boolean;

    // Flag indicating if users should be forcefully logged out
    @Column({ type: 'boolean', default: false })
    force_logout: boolean;
}