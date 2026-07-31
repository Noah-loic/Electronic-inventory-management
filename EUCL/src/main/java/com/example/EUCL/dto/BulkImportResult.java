package com.example.EUCL.dto;

import lombok.Getter;
import java.util.ArrayList;
import java.util.List;

@Getter
public class BulkImportResult {

    private int totalRows;
    private int successCount;
    private int failureCount;
    private final List<String> errors = new ArrayList<>();

    public void addSuccess() {
        totalRows++;
        successCount++;
    }

    public void addFailure(int excelRowNumber, String reason) {
        totalRows++;
        failureCount++;
        errors.add("Row " + excelRowNumber + ": " + reason);
    }
}
