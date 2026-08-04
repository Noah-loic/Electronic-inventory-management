package com.example.EUCL.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.example.EUCL.enums.Permission;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.EUCL.dto.RoleRequest;
import com.example.EUCL.entity.Role;
import com.example.EUCL.repository.AppUserRepository;
import com.example.EUCL.repository.RoleRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final AppUserRepository appUserRepository;

    public List<Role> findAll() {
        return roleRepository.findAll();
    }

    public Role findById(Long id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Role not found with id: " + id));
    }

    @Transactional
    public Role create(RoleRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Role name is required");
        }
        roleRepository.findByNameIgnoreCase(request.getName()).ifPresent(existing -> {
            throw new IllegalArgumentException("Role already exists with name: " + request.getName());
        });

        Role role = new Role();
        role.setName(request.getName());
        role.setDescription(request.getDescription());
        role.setPermissions(request.getPermissions() != null ? request.getPermissions() : new HashSet<>());
        return roleRepository.save(role);
    }

    @Transactional
    public Role update(Long id, RoleRequest request) {
        Role role = findById(id);
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Role name is required");
        }
        if (role.isSystem() && !role.getName().equals(request.getName())) {
            throw new IllegalArgumentException("Cannot rename a system role");
        }

        roleRepository.findByNameIgnoreCase(request.getName()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("Role already exists with name: " + request.getName());
            }
        });

        role.setName(request.getName());
        role.setDescription(request.getDescription());
        role.setPermissions(request.getPermissions() != null ? request.getPermissions() : new HashSet<>());
        Role saved = roleRepository.save(role);

        if (!"ADMIN".equalsIgnoreCase(saved.getName())) {
            appUserRepository.findByRoles_Id(id).forEach(user -> {
                Set<Permission> merged = user.getRoles().stream()
                        .flatMap(r -> r.getPermissions().stream())
                        .collect(Collectors.toSet());
                user.setPermissions(merged);
                appUserRepository.save(user);
            });
        }
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        Role role = findById(id);
        if (role.isSystem()) {
            throw new IllegalArgumentException("Cannot delete a system role");
        }

        long assignedCount = appUserRepository.findAll().stream()
                .filter(user -> user.getRoles().contains(role))
                .count();

        if (assignedCount > 0) {
            throw new IllegalArgumentException("Cannot delete a role assigned to " + assignedCount + " user(s)");
        }

        roleRepository.delete(role);
    }
}
