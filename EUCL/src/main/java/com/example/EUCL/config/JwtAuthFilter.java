package com.example.EUCL.config;

import java.io.IOException;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.EUCL.entity.AppUser;
import com.example.EUCL.enums.Permission;
import com.example.EUCL.repository.AppUserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final AppUserRepository appUserRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.isTokenValid(token)) {
                String username = jwtUtil.extractUsername(token);
                AppUser user = appUserRepository.findByUsername(username).orElse(null);
                if (user != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    List<GrantedAuthority> authorities = new ArrayList<>();
                    if (user.getRoles() != null) {
                        user.getRoles().forEach(role ->
                                authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getName()))
                        );
                    }
                    Set<Permission> effectivePermissions = resolvePermissions(user);
                    effectivePermissions.forEach(permission ->
                            authorities.add(new SimpleGrantedAuthority(permission.name()))
                    );
                    var auth = new UsernamePasswordAuthenticationToken(user, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private Set<Permission> resolvePermissions(AppUser user) {
        if (user.getRoles() != null && user.getRoles().stream().anyMatch(role -> role != null && "ADMIN".equalsIgnoreCase(role.getName()))) {
            return EnumSet.allOf(Permission.class);
        }

        Set<Permission> effective = new java.util.HashSet<>();
        if (user.getRoles() != null) {
            user.getRoles().forEach(role -> {
                if (role != null && role.getPermissions() != null)
                    effective.addAll(role.getPermissions());
            });
        }
        if (user.getPermissions() != null) {
            effective.addAll(user.getPermissions());
        }
        return effective;
    }
}
