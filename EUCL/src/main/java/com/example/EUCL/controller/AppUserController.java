package com.example.EUCL.controller;

import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.EUCL.dto.AppUserRequest;
import com.example.EUCL.dto.PermissionUpdateRequest;
import com.example.EUCL.entity.AppUser;
import com.example.EUCL.enums.Permission;
import com.example.EUCL.service.AppUserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class AppUserController {

    private final AppUserService appUserService;

    // ─── User Management ─────────────────────────────
    @PostMapping
    @PreAuthorize("hasAuthority('USER_CREATE')")
    @ResponseStatus(HttpStatus.CREATED)
    public AppUser create(@RequestBody AppUserRequest request) {
        return appUserService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    public List<AppUser> findAll() {
        return appUserService.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_READ') or authentication.principal.id == #id")
    public AppUser findById(@PathVariable Long id) {
        return appUserService.findById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public AppUser update(@PathVariable Long id, @RequestBody AppUserRequest request) {
        return appUserService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_DELETE')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        appUserService.delete(id);
    }

    // ─── Permission Management ────────────────────────
    @GetMapping("/{id}/permissions")
    @PreAuthorize("hasAuthority('USER_READ')")
    public Set<Permission> getPermissions(@PathVariable Long id) {
        return appUserService.getPermissions(id);
    }

    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public AppUser setPermissions(@PathVariable Long id, @RequestBody PermissionUpdateRequest request) {
        return appUserService.setPermissions(id, request);
    }

    @PostMapping("/{id}/permissions/grant")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public AppUser grantPermissions(@PathVariable Long id, @RequestBody PermissionUpdateRequest request) {
        return appUserService.grantPermissions(id, request);
    }

    @PostMapping("/{id}/permissions/revoke")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public AppUser revokePermissions(@PathVariable Long id, @RequestBody PermissionUpdateRequest request) {
        return appUserService.revokePermissions(id, request);
    }

    @PostMapping("/{id}/permissions/reset")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public AppUser resetToRoleDefaults(@PathVariable Long id) {
        return appUserService.resetToRoleDefaults(id);
    }
}
