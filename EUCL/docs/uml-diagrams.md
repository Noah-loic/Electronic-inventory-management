# UML Diagrams — EUCL Electronic Inventory Management

All diagrams are located in `src/uml/` and written in [PlantUML](https://plantuml.com/).
To preview them in VS Code, install the **PlantUML extension** and press `Alt+D` on any `.puml` file.

---

## 1. ERD — Entity Relationship Diagram (`erd.puml`)

Represents the physical database schema with 8 tables and their relationships.

> Blue tables extend `Auditable` (contain audit fields). Red tables do not.

### Tables

| Table | Color | Description |
|---|---|---|
| `branch` | Blue | EUCL branches across Rwanda. Auditable. |
| `department` | Blue | Organizational departments (ICT, FINANCE, COMMERCIAL, etc.). Managed as a table for flexibility. Auditable. |
| `employee` | Blue | All employees tracked in the system. Belongs to a department and a branch. Auditable. |
| `device` | Blue | Electronic inventory items (PC, laptop, printer, AC, etc.). Linked to a branch. Auditable. |
| `device_assignment` | Red | Records every assign and unassign action with timestamps. |
| `device_status_history` | Red | Records every status change on a device (who changed it, from what, to what, and why). |
| `repair_request` | Red | Records repair requests submitted by branch managers and handled by ICT staff. |
| `app_user` | Red | Login accounts for Admin, ICT Staff and Branch Managers. Linked to an employee record. |

### Audit Fields (on all blue tables)
| Field | Description |
|---|---|
| `created_at` | Timestamp when the record was created |
| `created_by` | FK → `app_user` who created the record |
| `updated_at` | Timestamp of the last update |
| `updated_by` | FK → `app_user` who last updated the record |

### Key Relationships
- An `employee` belongs to one `department` and one `branch`
- A `device` is stored at one `branch`
- A `device_assignment` links a `device` to an `employee` and tracks active/inactive state
- A `device_status_history` record is created on every status change — captures `old_status`, `new_status`, `reason`, `changed_by`, `changed_at`
- A `repair_request` is submitted by a branch manager for a broken device and handled by ICT staff at HQ
- An `app_user` is linked to one `employee` (not all employees have a user account — only Admin, ICT Staff and Branch Managers)

---

## 2. Class Diagram (`class_diagram.puml`)

Represents the Java application layer — entities, services, controllers, and repositories.

### Enums
- `DeviceStatus` — `ACTIVE`, `IN_REPAIR`, `DECOMMISSIONED`, `UNASSIGNED`
- `UserRole` — `ADMIN`, `ICT_STAFF`, `BRANCH_MANAGER`
- `RepairStatus` — `PENDING`, `IN_PROGRESS`, `REPAIRED`, `UNREPAIRABLE`

### Abstract Base Class — `Auditable`
An `@MappedSuperclass` abstract class. Not a database table — its fields are inherited into each child entity's table by JPA.

```
Auditable (abstract)
    ├── Branch
    ├── Department
    ├── Employee
    └── Device
```

Fields: `createdAt`, `createdBy`, `updatedAt`, `updatedBy`
Populated automatically by Spring Data JPA auditing (`@EnableJpaAuditing`).

### Entities
| Entity | Extends | Description |
|---|---|---|
| `Branch` | `Auditable` | Branch entity |
| `Department` | `Auditable` | Department entity |
| `Employee` | `Auditable` | Employee entity |
| `Device` | `Auditable` | Device entity |
| `DeviceAssignment` | — | Assignment history entity |
| `DeviceStatusHistory` | — | Status change history entity |
| `RepairRequest` | — | Repair request entity |
| `AppUser` | — | User account entity |

### Layered Architecture

```
Controller → Service → Repository → Database
```

| Layer | Classes |
|---|---|
| Controllers | `BranchController`, `DepartmentController`, `EmployeeController`, `DeviceController`, `DeviceAssignmentController`, `DeviceStatusHistoryController`, `RepairRequestController` |
| Services | `BranchService`, `DepartmentService`, `EmployeeService`, `DeviceService`, `DeviceAssignmentService`, `DeviceStatusHistoryService`, `RepairRequestService` |
| Repositories | `BranchRepository`, `DepartmentRepository`, `EmployeeRepository`, `DeviceRepository`, `DeviceAssignmentRepository`, `DeviceStatusHistoryRepository`, `RepairRequestRepository`, `AppUserRepository` |

---

## 3. Use Case Diagram (`use_case.puml`)

Shows what each actor can do in the system.

### Actors
- **Admin** — full access to all features including user and branch management
- **ICT Staff** — can manage devices, assignments and handle repair requests but cannot manage users, branches, employees, or departments
- **Branch Manager** — can submit repair requests and view requests from their own branch only

### Use Case Packages

| Package | Admin | ICT Staff | Branch Manager |
|---|---|---|---|
| Branch Management | Full CRUD | View only | No access |
| Department Management | Full CRUD | View only | No access |
| Employee Management | Full CRUD | View only | No access |
| Device Management | Full CRUD + Change Status + View Status History | Register, view, filter, update, change status, view status history | No access |
| Assignment & Tracking | Full access | Full access | No access |
| Repair Request Management | Full access | Handle requests (IN_PROGRESS, REPAIRED, UNREPAIRABLE) | Submit + view own branch |
| User Management | Full access | No access | No access |

---

## 4. Activity Diagram (`activity_diagram.puml`)

Covers the 8 core operational flows with decision branches and error paths.

### Flow 1 — Register a Device
ICT Staff or Admin provides device details. System checks for duplicate tag number or serial number. If unique, saves the device with status `UNASSIGNED`.

### Flow 2 — Assign Device to Employee
User selects a device and an employee. System validates the device is not `IN_REPAIR` or `DECOMMISSIONED` and has no active assignment. If valid, creates a `DeviceAssignment` record and sets device status to `ACTIVE`.

### Flow 3 — Unassign Device
User selects an active assignment. System closes it by setting `unassigned_at` and `is_active = false`, then sets device status back to `UNASSIGNED`.

### Flow 4 — Change Device Status
User selects a device, provides a new status and a reason. System validates the new status is different from the current one. If the new status is `IN_REPAIR` or `DECOMMISSIONED` and the device has an active assignment, the assignment is automatically closed. A `device_status_history` record is created and the device status is updated.

### Flow 5 — Submit Repair Request
Branch Manager or Admin selects a broken device and provides an issue description. System validates the user role and creates a `RepairRequest` with status `PENDING`. Device status remains unchanged at this point.

### Flow 6 — Handle Repair Request
ICT Staff or Admin selects a repair request and sets a new status with a resolution note:
- `IN_PROGRESS` → device status becomes `IN_REPAIR`, active assignment is automatically closed
- `REPAIRED` → device status becomes `UNASSIGNED`, `resolvedAt` is set
- `UNREPAIRABLE` → device status becomes `DECOMMISSIONED`, `resolvedAt` is set

In all cases a `device_status_history` record is created automatically.

### Flow 7 — Transfer Device
To reassign a device to a new employee, first unassign it then assign it to the new employee. Each action creates its own `DeviceAssignment` record preserving full history.

### Flow 8 — View Device History
User requests history for a device. System returns all `DeviceAssignment` records for that device ordered by `assigned_at` descending.
