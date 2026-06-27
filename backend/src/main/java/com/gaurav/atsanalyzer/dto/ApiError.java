package com.gaurav.atsanalyzer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@AllArgsConstructor
public class ApiError {
    private int status;
    private String error;
    private String message;
    private OffsetDateTime timestamp;

    public static ApiError of(int status, String error, String message) {
        return new ApiError(status, error, message, OffsetDateTime.now());
    }
}
