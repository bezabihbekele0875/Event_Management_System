package app.controller;


import app.dto.UserDto;
import app.model.User;
import app.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {
    private final UserRepository userRepository;

    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/users")
    public ResponseEntity<?> listUsers(@RequestHeader(value = "X-User-Role", defaultValue = "STUDENT") String rawRole) {
        if (app.domain.Role.safeValueOf(rawRole) != app.domain.Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only administrators can manage users."));
        }
        List<UserDto> users = userRepository.findAll().stream()
                .map(user -> new UserDto(user.getId(), user.getUsername(), user.getEmail(), user.getRole().name()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@RequestHeader(value = "X-User-Role", defaultValue = "STUDENT") String rawRole,
                                        @PathVariable Long id) {
        if (app.domain.Role.safeValueOf(rawRole) != app.domain.Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only administrators can delete users."));
        }
        return userRepository.findById(id)
                .map(user -> {
                    userRepository.delete(user);
                    return ResponseEntity.ok(Map.of("message", "User removed"));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found")));
    }
}
