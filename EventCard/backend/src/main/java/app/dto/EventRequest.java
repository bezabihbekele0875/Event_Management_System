package app.dto;

public record EventRequest(String title, String description, String date, Integer capacity, String type) {
}
