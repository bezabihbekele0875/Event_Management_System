package app.domain;

public enum EventType {
    SEMINAR,
    WORKSHOP,
    TRAINING,
    CLUBACTIVITY;

    public String getFriendlyName() {
        return switch (this) {
            case SEMINAR -> "Seminar";
            case WORKSHOP -> "Workshop";
            case TRAINING -> "Training";
            case CLUBACTIVITY -> "Club Activity";
        };
    }

    public static EventType safeValueOf(String raw) {
        try {
            return EventType.valueOf(raw == null ? "WORKSHOP" : raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            return WORKSHOP;
        }
    }
}
