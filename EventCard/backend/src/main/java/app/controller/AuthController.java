package app.controller;

import app.domain.Role;
import app.dto.LoginRequest;
import app.dto.RegisterRequest;
import app.dto.UserDto;
import app.model.User;
import app.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User user = authService.register(request.username(), request.email(), request.password(), request.role());
            return ResponseEntity.status(HttpStatus.CREATED).body(toDto(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        var authenticatedUser = authService.authenticate(request.username(), request.password());
        if (authenticatedUser.isPresent()) {
            return ResponseEntity.ok(toDto(authenticatedUser.get()));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Username or password is incorrect."));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "X-User-Id", required = false) String userId,
                                @RequestHeader(value = "X-User-Role", defaultValue = "STUDENT") String rawRole) {
        if (userId == null || userId.isBlank()) {
            return ResponseEntity.ok(error("No active session."));
        }
        Role role = Role.safeValueOf(rawRole);
        return ResponseEntity.ok(new UserDto(null, userId, "unknown", role.name()));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(message("Logged out successfully."));
    }

    private UserDto toDto(User user) {
        return new UserDto(user.getId(), user.getUsername(), user.getEmail(), user.getRole().name());
    }

    private Object error(String message) {
        return java.util.Map.of("error", message);
    }

    private Object message(String message) {
        return java.util.Map.of("message", message);
    }
}
