package app.domain;

public enum Role {
    STUDENT,
    ORGANIZER,
    ADMIN;

    public static Role safeValueOf(String raw) {
        try {
            return Role.valueOf(raw == null ? "STUDENT" : raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            return STUDENT;
        }
    }
}
