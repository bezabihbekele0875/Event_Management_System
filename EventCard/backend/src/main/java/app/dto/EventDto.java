package app.dto;

public record EventDto(
        Long id,
        String title,
        String description,
        String date,
        Integer capacity,
        String organizerId,
        String typeName,
        String type
) {
}
