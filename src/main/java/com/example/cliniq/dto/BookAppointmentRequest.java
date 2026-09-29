package com.example.cliniq.dto;

import jakarta.validation.constraints.NotNull;

public class BookAppointmentRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotNull(message = "Slot ID is required")
    private Long slotId;

    public BookAppointmentRequest() {
    }

    public BookAppointmentRequest(Long patientId, Long slotId) {
        this.patientId = patientId;
        this.slotId = slotId;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getSlotId() {
        return slotId;
    }

    public void setSlotId(Long slotId) {
        this.slotId = slotId;
    }
}
