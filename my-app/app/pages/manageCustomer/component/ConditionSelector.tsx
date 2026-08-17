import { Component } from "react";
import Select from "@/app/components/Select";
import TemplateFieldUtils from "./TemplateFieldUtils";
import type { ConditionSelectorProps, FieldCondition } from "@/app/types/manage-customer";

export default class ConditionSelector extends Component<ConditionSelectorProps> {
  private setType = (stickerType: string) => {
    this.props.onChange(TemplateFieldUtils.cleanCondition({
      ...this.props.value,
      stickerType: stickerType ? stickerType as NonNullable<FieldCondition>["stickerType"] : undefined,
    }));
  };

  private setOther = (stickerOther: string) => {
    this.props.onChange(TemplateFieldUtils.cleanCondition({
      ...this.props.value,
      stickerOther: stickerOther ? stickerOther as NonNullable<FieldCondition>["stickerOther"] : undefined,
    }));
  };

  render() {
    const { value, disabled = false } = this.props;

    return (
      <div className="condition-selector">
        <span>บังคับเมื่อ</span>
        <Select
          bare
          value={value?.stickerType ?? ""}
          disabled={disabled}
          onChange={(event) => this.setType(event.target.value)}
          aria-label="เงื่อนไข Type"
        >
          <option value="">ทุก Type</option>
          <option value="TNR">Type = TNR</option>
          <option value="NON TNR">Type = NON TNR</option>
        </Select>
        <Select
          bare
          value={value?.stickerOther ?? ""}
          disabled={disabled}
          onChange={(event) => this.setOther(event.target.value)}
          aria-label="เงื่อนไข Other"
        >
          <option value="">ทุก Other</option>
          <option value="Dome">Other = Dome</option>
          <option value="Inter">Other = Inter</option>
        </Select>
        <small>{TemplateFieldUtils.conditionText(value)}</small>
      </div>
    );
  }
}
