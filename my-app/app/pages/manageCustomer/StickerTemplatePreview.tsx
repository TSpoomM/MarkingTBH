import { Component } from "react";
import PreviewSticker from "./PreviewSticker";
import type { StickerTemplatePreviewProps } from "@/app/types/manage-customer";

export default class StickerTemplatePreview extends Component<StickerTemplatePreviewProps> {
  render() {
    const { customerName, insideFields, outsideFields, onSelect } = this.props;

    return (
      <div className="sticker-preview-wrap">
        <div className="template-draft-heading">
          <h3>Preview Sticker</h3>
          <span>ตัวอย่าง 1 ดวง</span>
        </div>
        <div className="sticker-preview-grid">
          <PreviewSticker
            title="ในกรอบ"
            section="inside"
            customerName={customerName}
            fields={insideFields}
            onSelect={onSelect}
          />
          <PreviewSticker
            title="นอกกรอบ"
            section="outside"
            customerName={customerName}
            fields={outsideFields}
            onSelect={onSelect}
          />
        </div>
      </div>
    );
  }
}
