package com.example.EUCL.dto;

import java.util.Set;

import com.example.EUCL.enums.Permission;

import lombok.Data;

@Data
public class RoleRequest {
    private String name;
    private String description;
    private Set<Permission> permissions;
}
