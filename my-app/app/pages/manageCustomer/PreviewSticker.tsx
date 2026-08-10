import { Component } from "react";
import TemplateFieldUtils from "./TemplateFieldUtils";
import type { PreviewStickerProps } from "@/app/types/manage-customer";

export default class PreviewSticker extends Component<PreviewStickerProps> {
  render() {
    const { title, customerName, fields } = this.props;
    const selectedFields = TemplateFieldUtils.selectedStickerFields(fields);
    const groupedFields = TemplateFieldUtils.groupSelectedStickerFields(selectedFields);

    return (
      <article className="sticker-preview-card">
        <header>
          <strong>{title}</strong>
          <span>{customerName}</span>
        </header>
        <dl>
          {groupedFields.map((group) => (
            <div className="sticker-preview-select-row" key={group.label}>
              <dt>{group.label}</dt>
              <dd>
                <div className="sticker-preview-section-selects">
                  {group.fields.map((selected) => (
                    <input
                      disabled
                      value={selected.label}
                      key={selected.key}
                      aria-label={selected.segmentLabel ?? selected.label}
                      readOnly
                    />
                  ))}
                </div>
              </dd>
            </div>
          ))}
        </dl>
      </article>
    );
  }
}
