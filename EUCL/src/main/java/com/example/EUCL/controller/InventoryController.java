package com.example.EUCL.controller;

import com.example.EUCL.dto.BulkImportResult;
import com.example.EUCL.dto.InventoryCheckRequest;
import com.example.EUCL.dto.InventoryRowDto;
import com.example.EUCL.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    @PreAuthorize("hasAuthority('REPORT_READ')")
    public List<InventoryRowDto> getInventory(@RequestParam Long branchId, @RequestParam int year) {
        return inventoryService.getInventory(branchId, year);
    }

    @PostMapping("/check")
    @PreAuthorize("hasAuthority('REPORT_READ')")
    public InventoryRowDto saveCheck(@RequestBody InventoryCheckRequest request) {
        return inventoryService.saveCheck(request);
    }

    @GetMapping("/template")
    @PreAuthorize("hasAuthority('REPORT_READ')")
    public ResponseEntity<byte[]> downloadTemplate(@RequestParam Long branchId, @RequestParam int year) throws Exception {
        byte[] bytes = inventoryService.generateTemplate(branchId, year);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=inventory_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @PostMapping("/bulk-import")
    @PreAuthorize("hasAuthority('REPORT_READ')")
    public BulkImportResult bulkImport(@RequestParam MultipartFile file,
                                       @RequestParam Long branchId,
                                       @RequestParam int year) throws Exception {
        return inventoryService.bulkImport(file, branchId, year);
    }
}
