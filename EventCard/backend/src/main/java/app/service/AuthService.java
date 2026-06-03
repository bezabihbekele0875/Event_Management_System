package app.service;

import app.domain.Role;
import app.model.User;
import app.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {
    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User register(String username, String email, String password, String rawRole) {
        if (username == null || username.isBlank() || email == null || email.isBlank() || password == null || password.length() < 6) {
            throw new IllegalArgumentException("Username, email, and password are required, and password must be at least 6 characters.");
        }

        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalStateException("An account with email " + email + " already exists.");
        }
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalStateException("Username " + username + " is already taken.");
        }

        Role role = Role.safeValueOf(rawRole);
        String passwordHash = BCrypt.hashpw(password, BCrypt.gensalt());
        User user = new User(username, email, passwordHash, role);
        return userRepository.save(user);
    }

    public Optional<User> authenticate(String username, String password) {
        return userRepository.findByUsernameIgnoreCase(username)
            .or(() -> userRepository.findByEmailIgnoreCase(username))
            .filter(user -> BCrypt.checkpw(password, user.getPasswordHash()));
    }
}
