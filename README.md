# University Event System

A campus event management ecosystem that combines event creation, registration, and notification services across multiple modules.

## Concept

This repository contains a modular university event system designed to help students, organizers, and administrators manage campus events with clarity and automation.

The system is built as a set of cooperating services:
- `EventCard`: event creation, catalog, search, authentication, and administrative event management.
- `Register`: registration workflow, duplicate protection, capacity checks, and student sign-up history.
- `Notification`: notification persistence, delivery abstraction, and event-driven messaging.
- Frontend UI components for event discovery, registration actions, and notification viewing.

## Problem Statement

University communities often struggle with fragmented event management:
- organizers need a single platform to publish and update event details,
- students need a way to search and register for events,
- administrators need visibility into users and event capacity,
- notifications must be delivered reliably and stored for later review.

This project solves those problems by separating concerns into dedicated services and providing:
- event creation, editing, and deletion,
- role-based authorization for students, organizers, and admins,
- registration tracking and capacity enforcement,
- notification storage with channel-based delivery,
- responsive UI components for each domain.

## Components

### EventCard Service

Responsible for event lifecycle management, user authentication, and admin operations.

- `app.controller.EventController`
  - Event listing, detail fetch, search, create, update, delete.
  - Category listing and event statistics.
  - Best-effort Notification service calls on create/delete.
- `app.controller.AuthController`
  - User registration and login.
  - Session user info and logout endpoint.
- `app.controller.AdminController`
  - Admin-only user listing and deletion.
- `app.service.EventService`
  - Business rules for event validation, role authorization, search, and persistence.
- `app.service.AuthService`
  - Registration validation, password hashing, and credential checks.
- `app.service.EventFactory`
  - Central event construction logic.
- `app.repository.EventRepository` and `app.repository.UserRepository`
  - Spring Data JPA persistence interfaces.
- `app.model.Event` and `app.model.User`
  - JPA entities.
- `app.domain.EventType` and `app.domain.Role`
  - Enumerations for event categories and user roles.

### Register Service

Handles student event registration with validation and notifications.

- `Register/backend/app.py`
  - Registration creation, listing, cancellation.
  - Event validation by calling `EventCard` service.
  - Duplicate registration prevention.
  - Capacity check to trigger event-full notifications.
  - Local persistence in PostgreSQL.

### Notification Service

Provides a generic notification engine with persistence and delivery patterns.

- `Notification/backend/app.py`
  - Notification REST API and event-specific trigger endpoints.
  - In-database notification storage.
  - Read/unread/delete operations.
- `NotificationCommand`
  - Encapsulates notification actions.
- `NotificationManager`
  - Central registry for observers.
- `DatabaseObserver`
  - Persists notifications.
- `ChannelObserver`
  - Formats and sends notifications via channels.
- `EmailStrategy` and `SmsStrategy`
  - Channel-specific delivery.
- `EmailAdapter`
  - External provider integration abstraction.

### UI Components

The UI layer is built with React components and connects to each backend service.
- `EventCard/frontend/src/components/EventList.jsx`
  - Search, filtering, and role-aware event listing.
- `EventCard/frontend/src/components/EventCard.jsx`
  - Event preview card with register/cancel/edit/delete actions.
- `Register/frontend/src/components/RegistrationForm.jsx`
  - Event registration form for students and organizers.
- `Register/frontend/src/components/MyRegistrationsPage.jsx`
  - Student registration history and cancellation UI.
- `Notification/frontend/src/components/NotificationsPage.jsx`
  - Notification inbox with refresh and read actions.

## Architecture

This system uses a modular service-oriented architecture:
- `EventCard/backend` is a Spring Boot REST service on `http://localhost:8080`.
- `Notification/backend` is a Flask service on `http://localhost:5000`.
- `Register/backend` is a Flask service on `http://localhost:5001`.
- Each backend uses PostgreSQL for persistence and follows separation of concerns.

### Interaction Flow

1. Organizer creates or updates an event using `EventCard`.
2. `EventCard` persists the event and triggers notification endpoints.
3. Student registers via `Register` service.
4. `Register` validates the event, stores the registration, and notifies `Notification`.
5. `Notification` persists and sends messages via configured channels.
6. Students view events, registrations, and notifications through UI components.

## Patterns and Why They Matter

### Factory Pattern

- Where: EventCard/backend/app/service/EventFactory.java

- What (code):

```java
public final class EventFactory {
  private EventFactory() {
    // utility class
  }

  public static Event build(String title, String description, String date, Integer capacity, String type, String organizerId) {
    return new Event(title, description, date, capacity, organizerId, EventType.safeValueOf(type));
  }
}
```

- Short description: centralizes construction of `Event` instances and converts raw strings to `EventType` safely.

### Repository / DAO Pattern

- Where: EventCard/backend/app/repository

- What (code):

```java
@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
}

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByUsername(String username);
  Optional<User> findByEmail(String email);
}
```

- Short description: Spring Data repositories abstract persistence operations so services focus on business logic.

### Observer Pattern

- Where: Notification/backend/app.py

- What (code):

```python
class NotificationCommand:
  def __init__(self, recipient, channel, message, meta=None):
    self.recipient = recipient
    self.channel = channel
    self.message = message
    self.meta = meta or {}

  def execute(self, observers):
    for obs in observers:
      try:
        obs.update(self)
      except Exception:
        pass

class NotificationManager:
  _instance = None

  def __init__(self):
    if NotificationManager._instance is not None:
      raise RuntimeError('Use get_instance()')
    self.observers = []

  @classmethod
  def get_instance(cls):
    if cls._instance is None:
      cls._instance = NotificationManager()
    return cls._instance

  def notify(self, recipients, channel, message, meta=None):
    if isinstance(recipients, str):
      recipients = [recipients]
    for r in recipients:
      cmd = NotificationCommand(r, channel, message, meta)
      cmd.execute(self.observers)
```

- Short description: observers register with `NotificationManager`; `NotificationCommand` is dispatched to each observer to perform persistence or delivery.

### Command Pattern

- Where: Notification/backend/app.py

- What (code):

```python
class NotificationCommand:
  def __init__(self, recipient, channel, message, meta=None):
    self.recipient = recipient
    self.channel = channel
    self.message = message
    self.meta = meta or {}

  def execute(self, observers):
    for obs in observers:
      obs.update(self)
```

- Short description: encapsulates a notification action (recipient, channel, message, metadata) so it can be handled uniformly by multiple observers.

### Strategy Pattern

- Where: Notification/backend/app.py

- What (code):

```python
class ChannelStrategy:
  def send(self, recipient, message):
    raise NotImplementedError()

class EmailStrategy(ChannelStrategy):
  def __init__(self, adapter):
    self.adapter = adapter

  def send(self, recipient, message):
    self.adapter.send_email(recipient, message)

class SmsStrategy(ChannelStrategy):
  def send(self, recipient, message):
    print(f"SMS to {recipient}: {message}")
```

- Short description: different delivery channels implement the same interface; callers choose a strategy at runtime.

### Adapter Pattern

- Where: Notification/backend/app.py

- What (code):

```python
class EmailAdapter:
  def send_email(self, recipient, message):
    # In real system, integrate with SMTP or a 3rd-party API
    print(f"[EmailAdapter] Sending email to {recipient}: {message}")
```

- Short description: adapts internal notification calls to an external email provider API.

### Adapter Pattern (Register subsystem)

- Where: `Register/backend/app.py`

- What (code):

```python
class EventServiceAdapter:
    def __init__(self, base_url):
        self.base_url = base_url

    def retrieve_event(self, event_id):
        response = requests.get(f"{self.base_url}/{event_id}", timeout=3)
        return response.json() if response.status_code == 200 else None

class NotificationServiceAdapter:
    def __init__(self, base_url):
        self.base_url = base_url

    def send_notification(self, recipient, channel, message):
        payload = {'recipient': recipient, 'channel': channel.upper(), 'message': message}
        requests.post(f"{self.base_url}/notifications", json=payload, timeout=2)
```

- Short description: wraps external `EventCard` and `Notification` HTTP calls in adapter classes so the Register service uses a stable internal interface for remote integration.

### Dispatch Example

- Where: `Notification/backend/app.py`

- What (code):

```python
manager.notify(
    recipients="student@example.com",
    channel="EMAIL",
    message="Your registration for AI Workshop is confirmed.",
    meta={"source": "Register", "event": {"id": "evt-123"}}
)
```

- Short description: builds a `NotificationCommand`, then sends it through the singleton manager so all observers can persist and deliver the notification.

### Template Method Pattern

- Where: Notification/backend/app.py

- What (code):

```python
class ChannelObserver(NotificationObserver):
  def __init__(self, strategy: ChannelStrategy):
    self.strategy = strategy

  def format_message(self, command: NotificationCommand):
    return f"[{command.meta.get('source','system')}] {command.message}"

  def update(self, command: NotificationCommand):
    formatted = self.format_message(command)
    threading.Thread(target=self.strategy.send, args=(command.recipient, formatted), daemon=True).start()
```

- Short description: `format_message` defines the message formatting algorithm with a stable structure while `update` runs delivery; subclasses can override formatting steps.

### Singleton Pattern

- Where: Notification/backend/app.py

- What (code):

```python
class NotificationManager:
  _instance = None

  @classmethod
  def get_instance(cls):
    if cls._instance is None:
      cls._instance = NotificationManager()
    return cls._instance
```

- Short description: ensures a single `NotificationManager` instance holds the observer registry and dispatch logic.

### MVC Pattern

- Where: EventCard/backend

- What (code):

```java
@RestController
@RequestMapping("/api/events")
public class EventController {
  private final EventService eventService;

  public EventController(EventService eventService) {
    this.eventService = eventService;
  }

  @GetMapping
  public List<EventDto> listEvents(@RequestParam(value = "q", required = false) String q) {
    return eventService.searchEvents(q).stream().map(this::toDto).collect(Collectors.toList());
  }
}
```

- Short description: controllers map HTTP to service-layer operations; services contain business logic and repositories persist data.


## Service Details

### Data Storage
- All backend services use PostgreSQL for persistence.
- `EventCard` uses Spring Boot JPA on `localhost:5432`.
- `Notification` and `Register` services also use PostgreSQL with the same default connection settings.

### Service Ports
- `EventCard/backend`: `8080`
- `Notification/backend`: `5000`
- `Register/backend`: `5001`

## Notes

- The repository is designed for extension: new notification channels, new event categories, or new registration policies can be added without changing the core service structure.
- The notification service is intentionally decoupled so event creation and registration logic do not depend on exact delivery mechanisms.
- Role-based guards in `EventCard` ensure only organizers and admins can mutate events.
- The `Register` service validates event existence and resolves capacity before issuing notifications.
