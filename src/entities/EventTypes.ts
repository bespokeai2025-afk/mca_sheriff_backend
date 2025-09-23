import { Entity, Column, OneToMany } from "typeorm";
import { Common } from "./Common";
import { EventRegistration } from "./EventRegistration";
import { Event } from "./Event";

// EventType entity representing different types of events
@Entity("event_types")
export class EventType extends Common {

    // Name of the event type (unique)
    @Column({ type: "varchar", length: 100, nullable: false })
    name: string;

    @Column({ type: "varchar", length: 100, nullable: true })
    sequenceNo: string;


    // Description of the event type (nullable)
    @Column({ type: "text", nullable: true })
    description: string | null;

    // Flag indicating if the event type is active
    @Column({ type: "boolean", default: true })
    isActive: boolean;

    @OneToMany(() => EventRegistration, (eventRegistration) => eventRegistration.id)
    eventRegistration: EventRegistration;

    @OneToMany(() => Event, (event) => event.id)
    event: Event;

    // URL or path to the category image (nullable)
    @Column({ type: 'text', nullable: true })
    image: string | null;
}