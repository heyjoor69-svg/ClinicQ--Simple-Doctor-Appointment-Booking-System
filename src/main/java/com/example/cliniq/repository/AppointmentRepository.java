package com.example.cliniq.repository;

import com.example.cliniq.entity.Appointment;
import com.example.cliniq.entity.AppointmentStatus;
import com.example.cliniq.entity.Slot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    Optional<Appointment> findBySlotAndStatus(Slot slot, AppointmentStatus status);

    boolean existsBySlotAndStatus(Slot slot, AppointmentStatus status);

    @Query("SELECT a FROM Appointment a JOIN a.slot s JOIN s.doctor d WHERE d.id = :doctorId AND a.status = :status AND s.slotDate = :date ORDER BY s.startTime ASC")
    List<Appointment> findDoctorAppointmentsForDate(@Param("doctorId") Long doctorId,
                                                  @Param("status") AppointmentStatus status,
                                                  @Param("date") LocalDate date);
}
