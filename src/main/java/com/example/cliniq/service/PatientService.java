package com.example.cliniq.service;

import com.example.cliniq.dto.CreatePatientRequest;
import com.example.cliniq.entity.Patient;
import com.example.cliniq.exception.ResourceNotFoundException;
import com.example.cliniq.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @Transactional
    public Patient addPatient(CreatePatientRequest request) {
        Patient patient = new Patient(request.getName(), request.getEmail(), request.getPhone());
        return patientRepository.save(patient);
    }

    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    public Patient getPatientById(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));
    }
}
