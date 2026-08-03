package com.example.EUCL.controller;

import com.example.EUCL.config.JwtUtil;
import com.example.EUCL.dto.LoginResponse;
import com.example.EUCL.entity.AppUser;
import com.example.EUCL.repository.AppUserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AppUserRepository appUserRepository;
    private final JwtUtil jwtUtil;

    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        AppUser user = appUserRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!user.getPassword().equals(request.getPassword()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");

        String token = jwtUtil.generateToken(user.getUsername());
        Set<String> roleNames = user.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toSet());
        return new LoginResponse(token, user.getId(), user.getUsername(), roleNames, user.getPermissions());
    }
}
