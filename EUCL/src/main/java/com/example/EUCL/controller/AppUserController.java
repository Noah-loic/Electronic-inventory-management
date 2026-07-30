package com.example.EUCL.controller;

import com.example.EUCL.dto.AppUserRequest;
import com.example.EUCL.dto.PermissionUpdateRequest;
import com.example.EUCL.entity.AppUser;
import com.example.EUCL.enums.Permission;
import com.example.EUCL.service.AppUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class AppUserController {

    private final AppUserService appUserService;

    // ─── User Management ─────────────────────────────
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppUser create(@RequestBody AppUserRequest request) {
        return appUserService.create(request);
    }

    @GetMapping
    public List<AppUser> findAll() {
        return appUserService.findAll();
    }

    @GetMapping("/{id}")
    public AppUser findById(@PathVariable Long id) {
        return appUserService.findById(id);
    }

    @PutMapping("/{id}")
    public AppUser update(@PathVariable Long id, @RequestBody AppUserRequest request) {
        return appUserService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        appUserService.delete(id);
    }

    // ─── Permission Management ────────────────────────
    @GetMapping("/{id}/permissions")
    public Set<Permission> getPermissions(@PathVariable Long id) {
        return appUserService.getPermissions(id);
    }

    @PutMapping("/{id}/permissions")
    public AppUser setPermissions(@PathVariable Long id, @RequestBody PermissionUpdateRequest request) {
        return appUserService.setPermissions(id, request);
    }

    @PostMapping("/{id}/permissions/grant")
    public AppUser grantPermissions(@PathVariable Long id, @RequestBody PermissionUpdateRequest request) {
        return appUserService.grantPermissions(id, request);
    }

    @PostMapping("/{id}/permissions/revoke")
    public AppUser revokePermissions(@PathVariable Long id, @RequestBody PermissionUpdateRequest request) {
        return appUserService.revokePermissions(id, request);
    }

    @PostMapping("/{id}/permissions/reset")
    public AppUser resetToRoleDefaults(@PathVariable Long id) {
        return appUserService.resetToRoleDefaults(id);
    }
}
