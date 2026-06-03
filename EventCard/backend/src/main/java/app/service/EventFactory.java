package app.service;

import app.domain.EventType;
import app.model.Event;

public final class EventFactory {
    private EventFactory() {
        // utility class
    }

    public static Event build(String title, String description, String date, Integer capacity, String type, String organizerId) {
        return new Event(title, description, date, capacity, organizerId, EventType.safeValueOf(type));
    }
}
