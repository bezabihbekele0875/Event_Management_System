package app.model;

import app.domain.EventType;
import jakarta.persistence.*;

@Entity
@Table(name = "events")
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String date;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false, length = 100)
    private String organizerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private EventType type = EventType.WORKSHOP;

    protected Event() {
    }

    public Event(String title, String description, String date, Integer capacity, String organizerId, EventType type) {
        this.title = title;
        this.description = description;
        this.date = date;
        this.capacity = capacity;
        this.organizerId = organizerId;
        this.type = type;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public String getOrganizerId() {
        return organizerId;
    }

    public EventType getType() {
        return type;
    }

    public void setType(EventType type) {
        this.type = type;
    }

    public String getTypeName() {
        return type.getFriendlyName();
    }
}
