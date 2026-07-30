package com.example.EUCL.dto;

import com.example.EUCL.enums.Permission;
import com.example.EUCL.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Set;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private Long id;
    private String username;
    private UserRole role;
    private Set<Permission> permissions;
}
