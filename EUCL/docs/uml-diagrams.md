# UML Diagrams — EUCL Electronic Inventory Management

All diagrams are located in `src/uml/` and written in [PlantUML](https://plantuml.com/).
To preview them in VS Code, install the **PlantUML extension** and press `Alt+D` on any `.puml` file.

---

## 1. ERD — Entity Relationship Diagram (`erd.puml`)

Represents the physical database schema with 6 tables and their relationships.

### Tables

| Table | Description |
|---|---|
| `branch` | Represents EUCL branches across Rwanda districts. Headquarters is in Nyarugenge. |
| `department` | Organizational departments (ICT, FINANCE, COMMERCIAL, etc.). Managed as a table for flexibility. |
| `employee` | All employees tracked in the system. Belongs to a department and a branch. |
| `device` | Electronic inventory items (PC, laptop, printer, AC, etc.). Linked to a branch. |
| `device_assignment` | Core history table. Records every assign, unassign, and transfer action with timestamps. |
| `app_user` | Login accounts for Admin and ICT Staff who manage the system. Linked to an employee record. |

### Key Relationships
- An `employee` belongs to one `department` and one `branch`
- A `device` is stored at one `branch`
- A `device_assignment` links a `device` to an `employee`, records who performed the action (`assigned_by`), and tracks active/inactive state
- An `app_user` is linked to one `employee` (not all employees have a user account — only Admin and ICT Staff)

---

## 2. Class Diagram (`class_diagram.puml`)

Represents the Java application layer — entities, services, controllers, and repositories.

### Enums
- `DeviceStatus` — `ACTIVE`, `IN_REPAIR`, `DECOMMISSIONED`, `UNASSIGNED`
- `UserRole` — `ADMIN`, `ICT_STAFF`

### Entities
Mirror the database tables as JPA entities: `Branch`, `Department`, `Employee`, `Device`, `DeviceAssignment`, `AppUser`.

### Layered Architecture

```
Controller → Service → Repository → Database
```

| Layer | Classes |
|---|---|
| Controllers | `BranchController`, `DepartmentController`, `EmployeeController`, `DeviceController`, `DeviceAssignmentController` |
| Services | `BranchService`, `DepartmentService`, `EmployeeService`, `DeviceService`, `DeviceAssignmentService` |
| Repositories | `BranchRepository`, `DepartmentRepository`, `EmployeeRepository`, `DeviceRepository`, `DeviceAssignmentRepository`, `AppUserRepository` |

---

## 3. Use Case Diagram (`use_case.puml`)

Shows what each actor can do in the system.

### Actors
- **Admin** — full access to all features including user and branch management
- **ICT Staff** — can manage devices and assignments but cannot manage users, branches, employees, or departments

### Use Case Packages

| Package | Admin | ICT Staff |
|---|---|---|
| Branch Management | Full CRUD | View only |
| Department Management | Full CRUD | View only |
| Employee Management | Full CRUD | View only |
| Device Management | Full CRUD | Register, view, filter, update |
| Assignment & Tracking | Full access | Full access |
| User Management | Full access | No access |

---

## 4. Activity Diagram (`activity_diagram.puml`)

Covers the 5 core operational flows with decision branches and error paths.

### Flow 1 — Register a Device
ICT Staff or Admin provides device details. System checks for duplicate tag number or serial number. If unique, saves the device with status `UNASSIGNED`.

### Flow 2 — Assign Device to Employee
User selects a device and an employee. System validates the device is not `IN_REPAIR` or `DECOMMISSIONED` and has no active assignment. If valid, creates a `DeviceAssignment` record and sets device status to `ACTIVE`.

### Flow 3 — Unassign Device
User selects an active assignment. System closes it by setting `unassigned_at` and `is_active = false`, then sets device status back to `UNASSIGNED`.

### Flow 4 — Transfer Device
User provides a new employee or new branch. System closes the current assignment (if any), creates a new `DeviceAssignment` for the new employee, and updates the device's branch if changed.

### Flow 5 — View Device History
User requests history for a device. System returns all `DeviceAssignment` records for that device ordered by `assigned_at` descending.
