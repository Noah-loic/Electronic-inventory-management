package com.example.EUCL.controller;

import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.EUCL.config.JwtUtil;
import com.example.EUCL.dto.LoginResponse;
import com.example.EUCL.entity.AppUser;
import com.example.EUCL.enums.Permission;
import com.example.EUCL.repository.AppUserRepository;

import lombok.Data;
import lombok.RequiredArgsConstructor;

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
        Set<Permission> effectivePermissions = user.getRoles().stream().anyMatch(role -> role != null && "ADMIN".equalsIgnoreCase(role.getName()))
                ? EnumSet.allOf(Permission.class)
                : user.getPermissions();
        return new LoginResponse(token, user.getId(), user.getUsername(), roleNames, effectivePermissions);
    }
}
