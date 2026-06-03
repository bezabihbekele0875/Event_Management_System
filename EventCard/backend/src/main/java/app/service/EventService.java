package app.service;

import app.domain.EventType;
import app.domain.Role;
import app.model.Event;
import app.repository.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class EventService {
    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    public Event getEventById(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event with ID " + eventId + " not found."));
    }

    public List<Event> searchEvents(String q) {
        if (q == null || q.isBlank()) {
            return getAllEvents();
        }
        String normalized = q.toLowerCase(Locale.ROOT).trim();
        return getAllEvents().stream()
                .filter(event -> event.getTitle().toLowerCase(Locale.ROOT).contains(normalized)
                        || event.getDescription().toLowerCase(Locale.ROOT).contains(normalized)
                        || event.getTypeName().toLowerCase(Locale.ROOT).contains(normalized))
                .collect(Collectors.toList());
    }

    @Transactional
    public Event createEvent(String title, String description, String date, Integer capacity, String type, String organizerId, Role role) {
        if (role != Role.ORGANIZER && role != Role.ADMIN) {
            throw new SecurityException("Only event organizers or administrators can create events.");
        }
        Event event = EventFactory.build(title, description, date, capacity, type, organizerId);
        return eventRepository.save(event);
    }

    @Transactional
    public Event updateEvent(Long eventId, String title, String description, String date, Integer capacity, String type, Role role) {
        if (role != Role.ORGANIZER && role != Role.ADMIN) {
            throw new SecurityException("Only event organizers or administrators can modify events.");
        }
        Event event = getEventById(eventId);
        event.setTitle(title);
        event.setDescription(description);
        event.setDate(date);
        event.setCapacity(capacity);
        event.setType(EventType.safeValueOf(type));
        return eventRepository.save(event);
    }

    @Transactional
    public void deleteEvent(Long eventId, Role role) {
        if (role != Role.ORGANIZER && role != Role.ADMIN) {
            throw new SecurityException("Only event organizers or administrators can delete events.");
        }
        Event event = getEventById(eventId);
        eventRepository.delete(event);
    }
}
