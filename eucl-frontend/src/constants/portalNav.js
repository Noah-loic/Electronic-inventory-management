export const PORTAL_NAV_ITEMS = [
    { to: '/portal/dashboard',        label: 'Dashboard',            permission: null },
    { to: '/portal/branches',         label: 'Branches',             permission: 'BRANCH_READ' },
    { to: '/portal/departments',      label: 'Departments',          permission: 'DEPARTMENT_READ' },
    { to: '/portal/employees',        label: 'Employees',            permission: 'EMPLOYEE_READ' },
    { to: '/portal/devices',          label: 'Devices',              permission: 'DEVICE_READ' },
    { to: '/portal/assignments',      label: 'Assignments',          permission: 'ASSIGNMENT_READ' },
    { to: '/portal/repair-requests',  label: 'Repair Requests',      permission: 'REPAIR_REQUEST_READ' },
    { to: '/portal/reports',           label: 'Reports',              permission: 'REPORT_READ' },
    { to: '/portal/users',             label: 'Users',                permission: 'USER_READ' },
    { to: '/portal/roles',            label: 'Roles & Permissions',  permission: 'ROLE_READ' },
]
