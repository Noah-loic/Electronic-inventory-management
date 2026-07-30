package com.example.EUCL.dto;

import com.example.EUCL.enums.UserRole;
import lombok.Data;

@Data
public class AppUserRequest {
    private String username;
    private String password;
    private UserRole role;
    private Long employeeId;
}
