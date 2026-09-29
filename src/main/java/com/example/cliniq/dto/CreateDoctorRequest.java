package com.example.cliniq.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateDoctorRequest {

    @NotBlank(message = "Doctor name is required")
    private String name;

    @NotBlank(message = "Doctor specialization is required")
    private String specialization;

    @NotBlank(message = "Doctor email is required")
    @Email(message = "Doctor email should be valid")
    private String email;

    @NotBlank(message = "Doctor phone is required")
    @Size(max = 20, message = "Doctor phone cannot exceed 20 characters")
    private String phone;

    public CreateDoctorRequest() {
    }

    public CreateDoctorRequest(String name, String specialization, String email, String phone) {
        this.name = name;
        this.specialization = specialization;
        this.email = email;
        this.phone = phone;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
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
