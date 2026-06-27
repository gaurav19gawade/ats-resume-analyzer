package com.gaurav.atsanalyzer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AnalyzeRequest {

    @NotBlank(message = "Job description is required")
    @Size(min = 50, max = 8000, message = "Job description must be between 50 and 8000 characters")
    private String jobDescription;

    @NotBlank(message = "Resume content is required")
    @Size(min = 50, max = 8000, message = "Resume must be between 50 and 8000 characters")
    private String resumeContent;

    @NotBlank(message = "ATS platform is required")
    private String atsPlatform;

    private String jobTitle;
    private String company;
    private boolean saveToHistory = true;
}
