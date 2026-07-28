package com.example.EUCL.entity;

import com.example.EUCL.enums.DeviceStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "device_status_history")
public class DeviceStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by", nullable = false)
    private AppUser changedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeviceStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeviceStatus newStatus;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime changedAt = LocalDateTime.now();
}
