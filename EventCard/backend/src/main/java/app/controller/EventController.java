package app.controller;

import app.domain.EventType;

import app.dto.EventDto;
import app.dto.EventRequest;
import app.model.Event;
import app.service.EventService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {
    private final EventService eventService;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public List<EventDto> listEvents(@RequestParam(value = "q", required = false) String q) {
        return eventService.searchEvents(q).stream().map(this::toDto).collect(Collectors.toList());
    }

    @GetMapping("/categories")
    public List<String> listCategories() {
        return List.of(EventType.values()).stream()
                .map(EventType::getFriendlyName)
                .collect(Collectors.toList());
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<?> getEvent(@PathVariable Long eventId) {
        try {
            return ResponseEntity.ok(toDto(eventService.getEventById(eventId)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createEvent(@RequestHeader(value = "X-User-Role", defaultValue = "STUDENT") String rawRole,
                                         @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId,
                                         @RequestBody EventRequest request) {
        try {
            app.domain.Role role = app.domain.Role.safeValueOf(rawRole);
            Event event = eventService.createEvent(request.title(), request.description(), request.date(), request.capacity(), request.type(), userId, role);
            // Notify Notification service about the new event (best-effort)
            try {
                String notifUrl = "http://localhost:5000/events/created";
                String payload = objectMapper.writeValueAsString(Map.of("event", toDto(event)));
                HttpRequest httpRequest = HttpRequest.newBuilder()
                        .uri(URI.create(notifUrl))
                        .timeout(Duration.ofSeconds(2))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(payload))
                        .build();
                httpClient.sendAsync(httpRequest, HttpResponse.BodyHandlers.discarding());
            } catch (Exception ignore) {
                // best-effort notify; ignore failures
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(toDto(event));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error(e.getMessage()));
        }
    }

    @PutMapping("/{eventId}")
    public ResponseEntity<?> updateEvent(@RequestHeader(value = "X-User-Role", defaultValue = "STUDENT") String rawRole,
                                         @PathVariable Long eventId,
                                         @RequestBody EventRequest request) {
        try {
            app.domain.Role role = app.domain.Role.safeValueOf(rawRole);
            Event event = eventService.updateEvent(eventId, request.title(), request.description(), request.date(), request.capacity(), request.type(), role);
            return ResponseEntity.ok(toDto(event));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error(e.getMessage()));
        }
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<?> deleteEvent(@RequestHeader(value = "X-User-Role", defaultValue = "STUDENT") String rawRole,
                                         @PathVariable Long eventId) {
        try {
            app.domain.Role role = app.domain.Role.safeValueOf(rawRole);
            eventService.deleteEvent(eventId, role);
            // Notify Notification service about deletion (best-effort). We don't have list of registered students here.
            try {
                String notifUrl = "http://localhost:5000/events/deleted";
                String payload = objectMapper.writeValueAsString(Map.of("event", Map.of("id", eventId), "notifyAdmin", true));
                HttpRequest httpRequest = HttpRequest.newBuilder()
                        .uri(URI.create(notifUrl))
                        .timeout(Duration.ofSeconds(2))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(payload))
                        .build();
                httpClient.sendAsync(httpRequest, HttpResponse.BodyHandlers.discarding());
            } catch (Exception ignore) {
            }
            return ResponseEntity.ok(message("Event deleted successfully."));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error(e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getMetrics(@RequestHeader(value = "X-User-Role", defaultValue = "STUDENT") String rawRole) {
        app.domain.Role role = app.domain.Role.safeValueOf(rawRole);
        if (role != app.domain.Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("Only administrators can access operational statistics."));
        }

        List<Event> events = eventService.getAllEvents();
        long seminarCount = events.stream().filter(event -> event.getType() == EventType.SEMINAR).count();
        long workshopCount = events.stream().filter(event -> event.getType() == EventType.WORKSHOP).count();
        long trainingCount = events.stream().filter(event -> event.getType() == EventType.TRAINING).count();
        long clubCount = events.stream().filter(event -> event.getType() == EventType.CLUBACTIVITY).count();
        long totalCapacity = events.stream().mapToLong(Event::getCapacity).sum();

        return ResponseEntity.ok(Map.of(
                "totalEvents", events.size(),
                "totalCapacity", totalCapacity,
                "seminarCount", seminarCount,
                "workshopCount", workshopCount,
                "trainingCount", trainingCount,
                "clubActivityCount", clubCount
        ));
    }

    private EventDto toDto(Event event) {
        return new EventDto(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getDate(),
                event.getCapacity(),
                event.getOrganizerId(),
                event.getTypeName(),
                event.getType().name()
        );
    }

    private Object error(String message) {
        return Map.of("error", message);
    }

    private Object message(String message) {
        return Map.of("message", message);
    }
}
