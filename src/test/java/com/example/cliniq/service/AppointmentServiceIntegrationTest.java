package com.example.cliniq.service;

import com.example.cliniq.dto.CreateDoctorRequest;
import com.example.cliniq.dto.CreatePatientRequest;
import com.example.cliniq.dto.CreateSlotRequest;
import com.example.cliniq.dto.BookAppointmentRequest;
import com.example.cliniq.entity.Appointment;
import com.example.cliniq.entity.AppointmentStatus;
import com.example.cliniq.entity.Doctor;
import com.example.cliniq.entity.Patient;
import com.example.cliniq.entity.Slot;
import com.example.cliniq.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class AppointmentServiceIntegrationTest {

    @Autowired
    private DoctorService doctorService;

    @Autowired
    private PatientService patientService;

    @Autowired
    private SlotService slotService;

    @Autowired
    private AppointmentService appointmentService;

    @Test
    void shouldBookAndCancelSlotAndAllowRebooking() {
        Doctor doctor = doctorService.addDoctor(new CreateDoctorRequest("Dr. John", "Cardiology", "john@example.com", "9876543210"));
        Patient patient1 = patientService.addPatient(new CreatePatientRequest("Rahul", "rahul@example.com", "9876501234"));
        Patient patient2 = patientService.addPatient(new CreatePatientRequest("Anita", "anita@example.com", "9876505678"));

        Slot slot = slotService.createSlot(doctor.getId(), new CreateSlotRequest(LocalDate.now(), LocalTime.of(10, 0), LocalTime.of(10, 30)));

        Appointment appointment = appointmentService.bookAppointment(new BookAppointmentRequest(patient1.getId(), slot.getId()));
        assertEquals(AppointmentStatus.BOOKED, appointment.getStatus());
        assertFalse(slotService.getSlotById(slot.getId()).isAvailable());

        BusinessException exception = assertThrows(BusinessException.class,
                () -> appointmentService.bookAppointment(new BookAppointmentRequest(patient2.getId(), slot.getId())));
        assertTrue(exception.getMessage().contains("already booked") || exception.getMessage().contains("not available"));

        Appointment cancelled = appointmentService.cancelAppointment(appointment.getId());
        assertEquals(AppointmentStatus.CANCELLED, cancelled.getStatus());
        assertTrue(slotService.getSlotById(slot.getId()).isAvailable());

        Appointment rebooked = appointmentService.bookAppointment(new BookAppointmentRequest(patient2.getId(), slot.getId()));
        assertEquals(patient2.getId(), rebooked.getPatient().getId());
        assertEquals(AppointmentStatus.BOOKED, rebooked.getStatus());
    }
}
