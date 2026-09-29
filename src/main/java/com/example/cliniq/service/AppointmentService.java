package com.example.cliniq.service;

import com.example.cliniq.dto.BookAppointmentRequest;
import com.example.cliniq.entity.Appointment;
import com.example.cliniq.entity.AppointmentStatus;
import com.example.cliniq.entity.Patient;
import com.example.cliniq.entity.Slot;
import com.example.cliniq.exception.BusinessException;
import com.example.cliniq.exception.ResourceNotFoundException;
import com.example.cliniq.repository.AppointmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientService patientService;
    private final SlotService slotService;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              PatientService patientService,
                              SlotService slotService) {
        this.appointmentRepository = appointmentRepository;
        this.patientService = patientService;
        this.slotService = slotService;
    }

    @Transactional
    public Appointment bookAppointment(BookAppointmentRequest request) {
        Patient patient = patientService.getPatientById(request.getPatientId());
        Slot slot = slotService.getSlotById(request.getSlotId());

        if (!slot.isAvailable()) {
            throw new BusinessException("Slot is not available");
        }

        if (appointmentRepository.existsBySlotAndStatus(slot, AppointmentStatus.BOOKED)) {
            throw new BusinessException("Slot is already booked");
        }

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setSlot(slot);
        appointment.setAppointmentDate(slot.getSlotDate());
        appointment.setStatus(AppointmentStatus.BOOKED);

        slot.setAvailable(false);
        appointmentRepository.save(appointment);
        return appointment;
    }

    public Appointment getAppointmentById(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    @Transactional
    public Appointment cancelAppointment(Long appointmentId) {
        Appointment appointment = getAppointmentById(appointmentId);

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BusinessException("Appointment is already cancelled");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        Slot slot = appointment.getSlot();
        slot.setAvailable(true);
        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getDoctorAppointmentsForToday(Long doctorId) {
        return appointmentRepository.findDoctorAppointmentsForDate(doctorId, AppointmentStatus.BOOKED, LocalDate.now());
    }
}
