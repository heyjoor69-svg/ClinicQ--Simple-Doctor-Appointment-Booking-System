package com.example.cliniq.repository;

import com.example.cliniq.entity.Doctor;
import com.example.cliniq.entity.Slot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface SlotRepository extends JpaRepository<Slot, Long> {
    List<Slot> findByDoctorId(Long doctorId);

    List<Slot> findByDoctorIdAndAvailableTrue(Long doctorId);

    List<Slot> findByDoctorIdAndAvailableTrueAndSlotDate(Long doctorId, LocalDate slotDate);

    boolean existsByIdAndAvailableTrue(Long slotId);
}
