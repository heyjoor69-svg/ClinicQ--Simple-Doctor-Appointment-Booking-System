package com.example.cliniq.controller;

import com.example.cliniq.dto.CreateSlotRequest;
import com.example.cliniq.entity.Slot;
import com.example.cliniq.service.SlotService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class SlotController {

    private final SlotService slotService;

    public SlotController(SlotService slotService) {
        this.slotService = slotService;
    }

    @PostMapping("/{doctorId}/slots")
    public ResponseEntity<Slot> createSlot(@PathVariable Long doctorId,
                                          @Valid @RequestBody CreateSlotRequest request) {
        Slot slot = slotService.createSlot(doctorId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(slot);
    }

    @GetMapping("/{doctorId}/slots")
    public List<Slot> getSlotsByDoctor(@PathVariable Long doctorId) {
        return slotService.getSlotsByDoctor(doctorId);
    }

    @GetMapping("/{doctorId}/slots/available")
    public List<Slot> getAvailableSlots(@PathVariable Long doctorId,
                                       @RequestParam(required = false) LocalDate date) {
        return slotService.getAvailableSlots(doctorId, date);
    }
}
