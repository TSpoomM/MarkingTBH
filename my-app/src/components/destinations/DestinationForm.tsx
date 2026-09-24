"use client";

import { Component, type FormEvent } from "react";
import { Plus } from "lucide-react";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import { PANEL } from "@/src/core/ui/surfaces";
import type { DestinationFormProps } from "@/src/core/models/destination";

export default class DestinationForm extends Component<DestinationFormProps> {
  private handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    this.props.onSubmit();
  };

  render() {
    const { value, isEditing, saving, onValueChange, onCancelEdit } = this.props;

    return (
      <form className={PANEL + " grid gap-4 p-5"} onSubmit={this.handleSubmit}>
        <div className="grid grid-cols-[minmax(260px,1fr)_120px] items-end gap-3 max-bp700:grid-cols-1">
          <Input
            label="Destination"
            value={value}
            onChange={(event) => onValueChange(event.currentTarget.value)}
            className="uppercase"
            placeholder="กรอก destination"
            required
          />
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
