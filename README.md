# CLINIQ — Simple Doctor Appointment Booking System

## Project Description
This is a simple backend project for a clinic appointment booking system. Doctors can publish appointment slots, patients can book available slots, and cancellations make the slot available again. The project is designed for a college-level assignment and keeps the implementation simple without authentication or advanced architecture.

## Features
- Add and manage doctors with specialization
- Add patients
- Create doctor appointment slots
- Book an available slot
- Prevent double booking of the same slot
- Cancel a booked appointment and reopen the slot
- View all appointments
- View today's booked appointments for a doctor

## Technologies
- Java 17
- Spring Boot 3.x
- Maven
- Spring Web
- Spring Data JPA
- Spring Validation
- MySQL

## Project Structure
```text
src/main/java/com/example/cliniq/
    CliniqApplication.java
    controller/
        DoctorController.java
        PatientController.java
        SlotController.java
        AppointmentController.java
    entity/
        Doctor.java
        Patient.java
        Slot.java
        Appointment.java
        AppointmentStatus.java
    repository/
        DoctorRepository.java
        PatientRepository.java
        SlotRepository.java
        AppointmentRepository.java
    service/
        DoctorService.java
        PatientService.java
        SlotService.java
        AppointmentService.java
    dto/
        CreateDoctorRequest.java
        CreatePatientRequest.java
        CreateSlotRequest.java
        BookAppointmentRequest.java
    exception/
        ResourceNotFoundException.java
        BusinessException.java
        GlobalExceptionHandler.java
```

## MySQL Setup
Before starting the application, create the database manually:

```sql
CREATE DATABASE cliniq_db;
```

Update the database password in `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/cliniq_db
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

## application.properties
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/cliniq_db
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

server.port=8080
```

## How to Run the Application
1. Make sure MySQL is running.
2. Create the database using `CREATE DATABASE cliniq_db;`.
3. Update the password in `application.properties`.
4. Run:

```bash
mvn spring-boot:run
```

Or on Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

## API Endpoints
### Doctor
- `POST /api/doctors`
- `GET /api/doctors`
- `GET /api/doctors/{id}`
- `DELETE /api/doctors/{id}`

### Patient
- `POST /api/patients`
- `GET /api/patients`
- `GET /api/patients/{id}`

### Slot
- `POST /api/doctors/{doctorId}/slots`
- `GET /api/doctors/{doctorId}/slots`
- `GET /api/doctors/{doctorId}/slots/available`
- `GET /api/doctors/{doctorId}/slots/available?date=2026-09-30`

### Appointment
- `POST /api/appointments`
- `GET /api/appointments`
- `GET /api/appointments/{id}`
- `PUT /api/appointments/{id}/cancel`
- `GET /api/doctors/{doctorId}/appointments/today`

## Example JSON Requests
### Create Doctor
```json
{
  "name": "Dr. John",
  "specialization": "Cardiology",
  "email": "john@example.com",
  "phone": "9876543210"
}
```

### Create Patient
```json
{
  "name": "Rahul",
  "email": "rahul@example.com",
  "phone": "9876501234"
}
```

### Create Slot
```json
{
  "slotDate": "2026-09-30",
  "startTime": "10:00",
  "endTime": "10:30"
}
```

### Book Slot
```json
{
  "patientId": 1,
  "slotId": 1
}
```

## Example Responses
### Doctor created
```json
{
  "id": 1,
  "name": "Dr. John",
  "specialization": "Cardiology",
  "email": "john@example.com",
  "phone": "9876543210"
}
```

### Appointment booked
```json
{
  "id": 1,
  "patient": {
    "id": 1,
    "name": "Rahul"
  },
  "slot": {
    "id": 1,
    "slotDate": "2026-09-30",
    "startTime": "10:00",
    "endTime": "10:30"
  },
  "appointmentDate": "2026-09-30",
  "status": "BOOKED"
}
```

## Business Rules
- A slot can be booked by only one patient at a time.
- Only a slot with `available = true` can be booked.
- A cancelled appointment must reopen the slot immediately.
- A cancelled appointment cannot be cancelled again.
- Invalid IDs return 404.
- Validation errors return 400.
- Double-booking is prevented in the service layer and database-safe constraints are enforced by the design.

## How to Test using Postman
1. Start the app.
2. Create a doctor with `POST /api/doctors`.
3. Create a patient with `POST /api/patients`.
4. Create a slot with `POST /api/doctors/1/slots`.
5. Book the slot with `POST /api/appointments`.
6. Try booking the same slot again and confirm it returns `409 Conflict`.
7. Cancel the appointment with `PUT /api/appointments/1/cancel`.
8. Book the same slot again with another patient.
9. Call `GET /api/doctors/1/appointments/today`.

## Expected Error Cases
- Doctor not found -> `404 Not Found`
- Patient not found -> `404 Not Found`
- Slot not found -> `404 Not Found`
- Slot already booked -> `409 Conflict`
- Slot not available -> `409 Conflict`
- Appointment already cancelled -> `409 Conflict`
- Invalid input -> `400 Bad Request`

## Postman Testing Order
1. `POST /api/doctors`
2. `POST /api/patients`
3. `POST /api/doctors/1/slots`
4. `POST /api/appointments`
5. Repeat `POST /api/appointments` on same slot -> should fail with 409
6. `PUT /api/appointments/1/cancel`
7. Book same slot again with another patient
8. `GET /api/doctors/1/appointments/today`

## Notes
This project avoids login, payment, notifications, Docker, and frontend code because those are not required by the assignment.
