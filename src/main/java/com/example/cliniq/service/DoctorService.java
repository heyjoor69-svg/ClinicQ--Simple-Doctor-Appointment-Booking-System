package com.example.cliniq.service;

import com.example.cliniq.dto.CreateDoctorRequest;
import com.example.cliniq.entity.Doctor;
import com.example.cliniq.exception.ResourceNotFoundException;
import com.example.cliniq.repository.DoctorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;

    public DoctorService(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    @Transactional
    public Doctor addDoctor(CreateDoctorRequest request) {
        Doctor doctor = new Doctor(request.getName(), request.getSpecialization(), request.getEmail(), request.getPhone());
        return doctorRepository.save(doctor);
    }

    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    public Doctor getDoctorById(Long doctorId) {
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));
    }

    @Transactional
    public void deleteDoctor(Long doctorId) {
        Doctor doctor = getDoctorById(doctorId);
        doctorRepository.delete(doctor);
    }
}
