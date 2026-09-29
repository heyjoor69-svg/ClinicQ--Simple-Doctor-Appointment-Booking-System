package com.example.cliniq.service;

import com.example.cliniq.dto.CreateSlotRequest;
import com.example.cliniq.entity.Doctor;
import com.example.cliniq.entity.Slot;
import com.example.cliniq.exception.BusinessException;
import com.example.cliniq.exception.ResourceNotFoundException;
import com.example.cliniq.repository.SlotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class SlotService {

    private final SlotRepository slotRepository;
    private final DoctorService doctorService;

    public SlotService(SlotRepository slotRepository, DoctorService doctorService) {
        this.slotRepository = slotRepository;
        this.doctorService = doctorService;
    }

    @Transactional
    public Slot createSlot(Long doctorId, CreateSlotRequest request) {
        Doctor doctor = doctorService.getDoctorById(doctorId);

        if (request.getSlotDate() == null) {
            throw new BusinessException("Slot date is required");
        }
        if (request.getStartTime() == null) {
            throw new BusinessException("Slot start time is required");
        }
        if (request.getEndTime() == null) {
            throw new BusinessException("Slot end time is required");
        }
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new BusinessException("Slot start time must be before end time");
        }

        Slot slot = new Slot(doctor, request.getSlotDate(), request.getStartTime(), request.getEndTime());
        return slotRepository.save(slot);
    }

    public List<Slot> getSlotsByDoctor(Long doctorId) {
        doctorService.getDoctorById(doctorId);
        return slotRepository.findByDoctorId(doctorId);
    }

    public List<Slot> getAvailableSlots(Long doctorId, LocalDate date) {
        doctorService.getDoctorById(doctorId);
        if (date == null) {
            return slotRepository.findByDoctorIdAndAvailableTrue(doctorId);
        }
        return slotRepository.findByDoctorIdAndAvailableTrueAndSlotDate(doctorId, date);
    }

    public Slot getSlotById(Long slotId) {
        return slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found with id: " + slotId));
    }
}
