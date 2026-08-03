package com.example.EUCL.controller;

import com.example.EUCL.dto.RoleRequest;
import com.example.EUCL.entity.Role;
import com.example.EUCL.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_CREATE')")
    @ResponseStatus(HttpStatus.CREATED)
    public Role create(@RequestBody RoleRequest request) {
        return roleService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public List<Role> findAll() {
        return roleService.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_READ')")
    public Role findById(@PathVariable Long id) {
        return roleService.findById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_UPDATE')")
    public Role update(@PathVariable Long id, @RequestBody RoleRequest request) {
        return roleService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_DELETE')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        roleService.delete(id);
    }
}
