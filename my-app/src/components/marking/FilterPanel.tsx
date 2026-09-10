"use client";

import { Component } from "react";
import Toast from "@/src/components/ui/Toast";
import { CONTAINER } from "@/src/core/ui/surfaces";
import Card from "@/src/components/ui/Card";
import Input from "@/src/components/ui/Input";
import CalendarInput from "@/src/components/ui/CalendarInput";
import TemplateAutocomplete from "@/src/components/templates/TemplateAutocomplete";
import SectionTitle from "@/src/components/ui/SectionTitle";
import type { MarkingFilterPanelProps } from "@/src/core/models/marking";

export default class FilterPanel extends Component<MarkingFilterPanelProps> {
  render() {
    const {
      notice, templates, templateId, productionDate, lotCount, lotStart, isLoading,
      onDismissNotice, onSelectTemplate, onProductionDateChange, onLotCountChange,
    } = this.props;

    return (
      <main className={CONTAINER}>
        {notice && (
          <Toast
            type={notice.type}
            message={notice.text}
            onClose={onDismissNotice}
          />
        )}
        <Card className="overflow-visible p-[clamp(20px,2.4vw,30px)] max-bp700:p-4">
          <SectionTitle
            number="1"
            title="รายละเอียดสติ๊กเกอร์"
            subtitle="เลือก Template พร้อมกรอกข้อมูลการผลิต และ จำนวน lot ที่ต้องการพิมพ์"
          />
          <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-[18px] max-bp700:grid-cols-1">
            <TemplateAutocomplete
              size="lg"
              label="Template"
              // hint={template ? `สติ๊กเกอร์นอกกรอบมี ${template.outside.length} ช่องข้อมูล` : undefined}
              selectedTemplateId={templateId}
              templates={templates}
              placeholder={isLoading ? "กำลังโหลด Template..." : "เลือก Template"}
              onSelectTemplate={onSelectTemplate}
              disabled={isLoading}
            />
            {templateId && (
              <>
                <CalendarInput
                  size="lg"
                  label="Production Date *"
                  value={productionDate}
                  onChange={onProductionDateChange}
                />
                <Input
                  size="lg"
                  label="จำนวน Lot ที่ต้องการ print *"
                  hint={`เริ่ม LOT ${lotStart}`}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={lotCount}
                  onChange={(event) => onLotCountChange(event.target.value)}
                />
              </>
            )}
          </div>
        </Card>
      </main>
    );
  }
}
