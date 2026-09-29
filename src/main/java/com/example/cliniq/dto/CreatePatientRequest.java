package com.example.cliniq.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreatePatientRequest {

    @NotBlank(message = "Patient name is required")
    private String name;

    @NotBlank(message = "Patient email is required")
    @Email(message = "Patient email should be valid")
    private String email;

    @NotBlank(message = "Patient phone is required")
    @Size(max = 20, message = "Patient phone cannot exceed 20 characters")
    private String phone;

    public CreatePatientRequest() {
    }

    public CreatePatientRequest(String name, String email, String phone) {
        this.name = name;
        this.email = email;
        this.phone = phone;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
