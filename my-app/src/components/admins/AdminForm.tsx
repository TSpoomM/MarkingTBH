"use client";

import { Component, type FormEvent } from "react";
import { Plus } from "lucide-react";
import Autocomplete from "@/src/components/ui/Autocomplete";
import Button from "@/src/components/ui/Button";
import Select from "@/src/components/ui/Select";
import { PANEL } from "@/src/core/ui/surfaces";
import type { AdminFormProps, AdminRole } from "@/src/core/models/admin";

export default class AdminForm extends Component<AdminFormProps> {
  private handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    this.props.onSubmit();
  };

  render() {
    const {
      employees, employeeQuery, role, isEditing, saving,
      onEmployeeQueryChange, onEmployeeSelect, onRoleChange, onCancelEdit,
    } = this.props;
    const employeeOptions = employees.map((employee) => ({ value: employee.fsId, label: employee.name }));

    return (
      <form className={PANEL + " grid gap-4 p-5"} onSubmit={this.handleSubmit}>
        <div className="grid grid-cols-[minmax(260px,1fr)_180px_120px] items-end gap-3 max-bp900:grid-cols-1">
          <Autocomplete
            label="ชื่อพนักงาน"
            value={employeeQuery}
            options={employeeOptions}
            maxOptions={30}
            disabled={isEditing}
            onChange={(event) => onEmployeeQueryChange(event.currentTarget.value)}
            onSelectOption={(option) => onEmployeeSelect({ fsId: option.value, name: option.label })}
            required
          />
          <Select
            label="role"
            value={role}
            onChange={(event) => onRoleChange(event.currentTarget.value as AdminRole)}
          >
            <option value="admin">admin</option>
            <option value="super_admin">super_admin</option>
          </Select>
          <div className="grid gap-2">
            <span className="invisible text-sm font-extrabold">Save</span>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="h-[45px] min-h-[45px] w-full"
              loading={saving}
              loadingText="Saving..."
            >
              <Plus size={16} aria-hidden="true" />
              {isEditing ? "Update" : "Save"}
            </Button>
            <small className="invisible text-[14px] leading-[1.4]">.</small>
          </div>
        </div>
        {isEditing && (
          <div className="flex justify-end">
            <Button type="button" variant="secondary" size="md" onClick={onCancelEdit}>
              ยกเลิกแก้ไข
            </Button>
          </div>
        )}
      </form>
    );
  }
}
