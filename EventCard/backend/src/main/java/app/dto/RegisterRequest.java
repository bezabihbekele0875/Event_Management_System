package app.dto;

public record RegisterRequest(String username, String email, String password, String role) {
}
