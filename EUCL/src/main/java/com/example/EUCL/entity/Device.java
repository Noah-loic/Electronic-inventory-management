package com.example.EUCL.entity;

import com.example.EUCL.enums.DeviceStatus;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "device")
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String tagNumber;

    @Column(nullable = false)
    private String model;

    @Column(nullable = false, unique = true)
    private String serialNumber;

    @Column(nullable = false)
    private String deviceType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeviceStatus status = DeviceStatus.UNASSIGNED;

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;
}
